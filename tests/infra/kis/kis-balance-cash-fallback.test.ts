// @vitest-environment node
import { Hono, type Context } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month.ts'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'
type Summary = { cash: number; cashD2?: number; cashSource: 'kis' | 'user' | null; cashAsOf: string | null; cashFallback: boolean; cashUnavailable: boolean }
const KEY = 'cash-last:a1:29'
const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
const cached = { cashWon: 5000, asOf: seoulDateTime(new Date(Date.now() - 86400000)), source: 'kis' }
const holding = { pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000', pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28' }
const summary = { dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000', pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000', asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84' }
const bodyWith = (cash?: string, cashD2?: string) => {
  const row = { ...summary } as Record<string, string>
  if (cash === undefined) delete row.dnca_tot_amt; else row.dnca_tot_amt = cash
  if (cashD2 !== undefined) row.prvs_rcdl_excc_amt = cashD2
  return { rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1: [holding], output2: [row] }
}
let credRow: Record<string, string> = {}
let kisBody: unknown = bodyWith('1,900,000')
let cache: KVNamespace
beforeAll(async () => {
  credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '29' }
})
const credsDb = (row: unknown) => ({ prepare: () => ({ bind: (..._args: unknown[]) => ({ first: async () => row, run: async () => ({ success: true }) }) }) }) as unknown as D1Database
const fetchFn = vi.fn(async (input: RequestInfo | URL) => new Response(JSON.stringify(String(input).includes('/oauth2/') ? { access_token: 'PROTECT-TOKEN', expires_in: 3600 } : kisBody), { status: 200 }))
const request = () => new Hono<{ Bindings: Env }>()
  .get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch))
  .request('/api/accounts/a1/products/29/balance', { method: 'GET' }, { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: cache } as unknown as Env)
const summaryOf = async (response: Response) => (await response.json() as { summary: Summary }).summary
beforeEach(() => {
  vi.clearAllMocks(); cache = createFakeKv(); kisBody = bodyWith('1,900,000')
})
describe('kis 잔고 현금 대체', () => {
  it('KIS 현금이 있으면 응답에 쓰고 cash-last 캐시에 저장한다', async () => {
    const put = vi.spyOn(cache, 'put')
    const response = await request()
    expect(response.status).toBe(200)
    const summary = await summaryOf(response)
    expect(summary).toMatchObject({ cash: 1900000, cashSource: 'kis', cashFallback: false, cashUnavailable: false })
    expect(summary.cashAsOf).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    const stored = JSON.parse((await cache.get(KEY))!)
    expect(stored).toMatchObject({ cashWon: 1900000, source: 'kis', asOf: summary.cashAsOf })
    expect(put.mock.calls.find(([key]) => key === KEY)?.[2]).toEqual({ expirationTtl: 604800 })
  })
  it.each([
    ['저장된 현금', JSON.stringify(cached), { cash: 5000, cashSource: 'kis', cashAsOf: cached.asOf, cashFallback: true, cashUnavailable: false }],
    ['캐시 없음', null, { cash: 0, cashSource: null, cashAsOf: null, cashFallback: false, cashUnavailable: true }],
    ['깨진 캐시', '{"cashWon":', { cash: 0, cashSource: null, cashAsOf: null, cashFallback: false, cashUnavailable: true }],
  ] as Array<[string, string | null, Partial<Summary>]>)('dnca_tot_amt 누락 + %s이면 200으로 응답한다', async (_label, raw, expected) => {
    kisBody = bodyWith(undefined)
    if (raw !== null) await cache.put(KEY, raw)
    const response = await request()
    expect(response.status).toBe(200)
    expect(await summaryOf(response)).toMatchObject(expected)
  })
  it('D+2를 저장하고 D+0 대체 시 캐시 D+2를 쓴다', async () => {
    kisBody = bodyWith('1,900,000', '2,500,000')
    expect((await summaryOf(await request())).cashD2).toBe(2500000)
    expect(JSON.parse((await cache.get(KEY))!)).toMatchObject({ cashWon: 1900000, cashD2Won: 2500000 })
    kisBody = bodyWith(undefined); await cache.put(KEY, JSON.stringify({ ...cached, cashD2Won: 7000 }))
    expect(await summaryOf(await request())).toMatchObject({ cash: 5000, cashD2: 7000 })
  })
  it('dnca_tot_amt가 0이면 캐시를 저장하지 않는다', async () => {
    kisBody = bodyWith('0'); const response = await request(); expect(response.status).toBe(200)
    expect(await summaryOf(response)).toMatchObject({ cash: 0, cashUnavailable: true })
    expect(await cache.get(KEY)).toBeNull()
  })
  it('대체 현금 사용 시 계좌번호·키·토큰·금액을 로그로 남기지 않는다', async () => {
    kisBody = bodyWith(undefined)
    await cache.put(KEY, JSON.stringify(cached))
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await request()).status).toBe(200)
    const logged = [...log.mock.calls, ...error.mock.calls].map((args) => args.map((arg) => arg instanceof Error ? String(arg) : JSON.stringify(arg) ?? String(arg)).join(' ')).join('\n')
    log.mockRestore(); error.mockRestore(); for (const secret of ['12345678', 'PROTECT-AK', 'PROTECT-SK', 'PROTECT-TOKEN', '5000']) expect(logged).not.toContain(secret)
  })
})
