import type { createAccountRepository } from '../accounts/account-repository.ts'
import { getKisToken, invalidateKisToken } from './kis-token.ts'

type Dependencies = {
  cache: KVNamespace
  repository: Pick<ReturnType<typeof createAccountRepository>, 'findCredentials'>
  key: string
  fetchFn: typeof fetch
  now?: () => number
}
type RequestOptions = {
  method: string
  trId: string
  query?: Record<string, string | number | boolean>
  body?: unknown
  headers?: Record<string, string>
  retry?: boolean // false면 401/토큰만료에도 재시도하지 않는다 (주문용). 기본 true.
}
// 확인 필요: 실전/모의 도메인·hashkey 필요 여부는 테스트베드에서 확정
const origin = 'https://openapi.koreainvestment.com:9443'

export function createKisClient({ cache, repository, key, fetchFn, now = Date.now }: Dependencies) {
  return {
    async forAccount(accountId: string) {
      const creds = await repository.findCredentials(accountId, key)
      if (!creds) return null
      const token = () => getKisToken(cache, accountId, creds, fetchFn, now())
      return {
        accountNumber: creds.accountNumber,
        productCode: creds.productCode,
        async ensureToken() {
          const { issued, expiresAt } = await token()
          return { issued, expiresAt }
        },
        async hashkey(body: unknown) {
          const response = await fetchFn(`${origin}/uapi/hashkey`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', appkey: creds.accessKey, appsecret: creds.secretKey },
            body: JSON.stringify(body),
          })
          const hash = ((await response.json()) as { HASH?: unknown }).HASH
          if (typeof hash !== 'string' || !hash) throw new Error('KIS hashkey request failed')
          return hash
        },
        async request(path: string, options: RequestOptions): Promise<Response> {
          if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid KIS path')
          const url = new URL(`${origin}${path}`)
          for (const [name, value] of Object.entries(options.query ?? {})) {
            url.searchParams.set(name, String(value))
          }
          for (let attempt = 0; attempt < 2; attempt++) {
            const { accessToken } = await token()
            const response = await fetchFn(url.toString(), {
              method: options.method,
              headers: {
                'content-type': 'application/json', authorization: `Bearer ${accessToken}`,
                appkey: creds.accessKey, appsecret: creds.secretKey,
                tr_id: options.trId, custtype: 'P',
                ...options.headers,
              },
              body: options.body === undefined ? undefined : JSON.stringify(options.body),
            })
            if (attempt === 1 || options.retry === false) {
              if (options.retry === false) await invalidateKisToken(cache, accountId)
              return response
            }
            const expired = response.status === 401 || await response.clone().json().then(
              (body) => typeof body === 'object' && body !== null &&
                'msg_cd' in body && body.msg_cd === 'EGW00123',
              () => false,
            )
            if (!expired) return response
            await invalidateKisToken(cache, accountId)
          }
          throw new Error('KIS request failed')
        },
      }
    },
  }
}
