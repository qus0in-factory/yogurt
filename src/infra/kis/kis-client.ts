import type { createAccountRepository } from '../accounts/account-repository.ts'
import { getKisToken, invalidateKisToken } from './kis-token.ts'
import { KIS_RATE_LIMIT_CODES } from '../../domain/trading/kis-rate-limit.ts'
import { KIS_MAX_READ_ATTEMPTS, KIS_MIN_INTERVAL_MS, createKisQueue, type KisQueue, type KisQueuePriority } from './kis-request-queue.ts'

type Dependencies = {
  cache: KVNamespace
  repository: Pick<ReturnType<typeof createAccountRepository>, 'findCredentials'>
  key: string; fetchFn: typeof fetch; now?: () => number; queue?: KisQueue; sleep?: (ms: number) => Promise<void>
}
type RequestOptions = {
  method: string; trId: string
  query?: Record<string, string | number | boolean>; body?: unknown
  headers?: Record<string, string>
  retry?: boolean // false면 401/토큰만료에도 재시도하지 않는다 (주문용). 기본 true.
  priority?: KisQueuePriority // 미지정 시 fill(체결 조회 등). 주문은 order, 읽기는 read.
}
// 확인 필요: 실전/모의 도메인·hashkey 필요 여부는 테스트베드에서 확정
const origin = 'https://openapi.koreainvestment.com:9443', TOKEN_EXPIRED = 'EGW00123'

async function msgCode(response: Response, code: string | ReadonlySet<string>): Promise<boolean> {
  const body = (await response.clone().json().catch(() => null)) as { msg_cd?: unknown } | null
  return typeof body === 'object' && body !== null && typeof body.msg_cd === 'string' && (typeof code === 'string' ? body.msg_cd === code : code.has(body.msg_cd))
}

export function createKisClient({ cache, repository, key, fetchFn, now = Date.now, queue = createKisQueue(), sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) }: Dependencies) {
  return {
    async forAccount(accountId: string) {
      const creds = await repository.findCredentials(accountId, key)
      if (!creds) return null
      const token = () => getKisToken(cache, accountId, creds, fetchFn, now())
      return {
        accountNumber: creds.accountNumber, productCode: creds.productCode,
        async ensureToken() { const { issued, expiresAt } = await token(); return { issued, expiresAt } },
        async hashkey(body: unknown) {
          const response = await fetchFn(`${origin}/uapi/hashkey`, {
            method: 'POST', headers: { 'content-type': 'application/json', appkey: creds.accessKey, appsecret: creds.secretKey },
            body: JSON.stringify(body),
          })
          const hash = ((await response.json()) as { HASH?: unknown }).HASH
          if (typeof hash !== 'string' || !hash) throw new Error('KIS hashkey request failed')
          return hash
        },
        async request(path: string, options: RequestOptions): Promise<Response> {
          if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid KIS path')
          const url = new URL(`${origin}${path}`)
          for (const [name, value] of Object.entries(options.query ?? {})) url.searchParams.set(name, String(value))
          const priority = options.priority ?? 'fill'
          const readRetryable = options.method === 'GET' && options.retry !== false
          let tokenRefreshed = false, rateRetries = 0
          for (;;) {
            const { accessToken } = await token()
            const response = await queue.run(priority, () => fetchFn(url.toString(), {
              method: options.method,
              headers: {
                'content-type': 'application/json', authorization: `Bearer ${accessToken}`,
                appkey: creds.accessKey, appsecret: creds.secretKey, tr_id: options.trId, custtype: 'P', ...options.headers,
              },
              body: options.body === undefined ? undefined : JSON.stringify(options.body),
            }))
            if (response.status === 401 || await msgCode(response, TOKEN_EXPIRED)) {
              if (!tokenRefreshed) await invalidateKisToken(cache, accountId)
              if (options.retry === false || tokenRefreshed) return response
              tokenRefreshed = true
              continue
            }
            // 읽기 조회만 초당 제한 코드에 지수 백오프로 재시도한다. 주문 POST는 제외.
            if (readRetryable && rateRetries < KIS_MAX_READ_ATTEMPTS - 1 && await msgCode(response, KIS_RATE_LIMIT_CODES)) {
              console.info(JSON.stringify({ kind: 'rate-limited', msg_cd: 'rate-limited', tr_id: options.trId }))
              await sleep(KIS_MIN_INTERVAL_MS * 2 ** rateRetries)
              rateRetries += 1
              continue
            }
            return response
          }
        },
      }
    },
  }
}
