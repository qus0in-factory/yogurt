// @vitest-environment node
import { Hono, type Context } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month.ts'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'

type Summary = { cash: number; cashSource: 'kis' | 'user' | null; cashAsOf: string | null; cashFallback: boolean; cashUnavailable: boolean }
const KEY = 'cash-last:a1:29'
const DAY = 86400000
const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
const asOf = (days: number) => seoulDateTime(new Date(Date.now() - days * DAY))
const userCached = { cashWon: 7000, asOf: asOf(1), source: 'user' as const }
const holding = { pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000', pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28' }
const summary = { dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000', pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000', asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84' }
const bodyWith = (cash?: string) => {
  const row = { ...summary } as Record<string, string>
  if (cash === undefined) delete row.dnca_tot_amt
  else row.dnca_tot_amt = cash
  return { rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1: [holding], output2: [row] }
}
let credRow: Record<string, string> = {}
let kisBody: unknown = bodyWith()
let cache: KVNamespace

beforeAll(async () => {
  credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '29' }
})
const credsDb = (row: unknown) => ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) }) as unknown as D1Database
const fetchFn = vi.fn(async (input: RequestInfo | URL) => new Response(JSON.stringify(String(input).includes('/oauth2/') ? { access_token: 'PROTECT-TOKEN', expires_in: 3600 } : kisBody), { status: 200 }))
const request = () => new Hono<{ Bindings: Env }>()
  .get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch))
  .request('/api/accounts/a1/products/29/balance', { method: 'GET' }, { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: cache } as unknown as Env)
const summaryOf = async (response: Response) => (await response.json() as { summary: Summary }).summary

beforeEach(() => { vi.clearAllMocks(); cache = createFakeKv(); kisBody = bodyWith('1,900,000') })

describe('kis 잔고 현금 캐시 신선도', () => {
  it('8일 지난 cash-last는 사용하지 않고 캐시도 덮지 않는다', async () => {
    const seeded = JSON.stringify({ cashWon: 5000, asOf: asOf(8), source: 'kis' })
    await cache.put(KEY, seeded)
    kisBody = bodyWith(undefined)
    const response = await request()
    expect(response.status).toBe(200)
    expect(await summaryOf(response)).toMatchObject({ cash: 0, cashSource: null, cashFallback: false, cashUnavailable: true })
    expect(await cache.get(KEY)).toBe(seeded)
  })
  it('user 소스 캐시로도 대체하며 출처를 user로 응답한다', async () => {
    await cache.put(KEY, JSON.stringify(userCached))
    kisBody = bodyWith(undefined)
    const response = await request()
    expect(response.status).toBe(200)
    expect(await summaryOf(response)).toMatchObject({ cash: 7000, cashSource: 'user', cashAsOf: userCached.asOf, cashFallback: true, cashUnavailable: false })
  })
  it('KIS 현금이 정상이면 cash-last를 읽지 않는다', async () => {
    const get = vi.spyOn(cache, 'get')
    const response = await request()
    expect(response.status).toBe(200)
    expect(await summaryOf(response)).toMatchObject({ cash: 1900000, cashSource: 'kis', cashFallback: false })
    const readKeys = get.mock.calls.map((call) => String(call[0]))
    expect(readKeys).not.toContain(KEY)
  })
})
