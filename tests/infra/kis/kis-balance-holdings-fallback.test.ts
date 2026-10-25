// @vitest-environment node
import { Hono, type Context } from 'hono'
import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month.ts'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'
type Body = { holdings: Array<Record<string, unknown>>; holdingsSource: 'kis' | 'kv' | null; holdingsAsOf: string | null; holdingsFallback: boolean; holdingsUnavailable: boolean; holdingsPartialWarning: boolean }
const KEY = 'holdings-last:a1:29'
const DAY = 86400000
const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
const asOfDaysAgo = (days: number) => seoulDateTime(new Date(Date.now() - days * DAY))
const holding = { pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000', pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28' }
const normalized = { code: '005930', name: '삼성전자', quantity: 10, averagePrice: 70000, purchaseAmount: 700000, currentPrice: 80000, evaluationAmount: 800000, profitLoss: 100000, profitLossRate: 14.28 }
const summary = { dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000', pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000', asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84' }
const bodyWith = (output1: unknown[], patch: Record<string, string> = {}) => ({ rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1, output2: [{ ...summary, ...patch }] })
const cachedBody = (asOf: string) => JSON.stringify({ holdings: [normalized], stockEvaluationWon: 800000, asOf })
let credRow: Record<string, string> = {}
let kisBody: unknown = bodyWith([holding])
let cache: KVNamespace

beforeAll(async () => { credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '29' } })
const credsDb = (row: unknown) => ({ prepare: () => ({ bind: (..._args: unknown[]) => ({ first: async () => row, run: async () => ({ success: true }) }) }) }) as unknown as D1Database
const fetchFn = vi.fn(async (input: RequestInfo | URL) => new Response(JSON.stringify(String(input).includes('/oauth2/') ? { access_token: 'PROTECT-TOKEN', expires_in: 3600 } : kisBody), { status: 200 }))
const request = () => new Hono<{ Bindings: Env }>().get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch)).request('/api/accounts/a1/products/29/balance', { method: 'GET' }, { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: cache } as unknown as Env)
const bodyOf = async (response: Response) => await response.json() as Body

beforeEach(() => { vi.clearAllMocks(); cache = createFakeKv(); kisBody = bodyWith([holding]) })

it('보유 누락 + 신선한 캐시면 캐시 보유로 200 응답하고 캐시를 덮지 않는다', async () => {
  const cachedAsOf = asOfDaysAgo(1)
  await cache.put(KEY, cachedBody(cachedAsOf))
  kisBody = bodyWith([], { scts_evlu_amt: '0' })
  const put = vi.spyOn(cache, 'put')
  const response = await request()
  expect(response.status).toBe(200)
  expect(await bodyOf(response)).toMatchObject({ holdings: [normalized], holdingsSource: 'kv', holdingsAsOf: cachedAsOf, holdingsFallback: true, holdingsUnavailable: false, holdingsPartialWarning: false })
  expect(put.mock.calls.some(([key]) => key === KEY)).toBe(false)
})
it.each([
  ['캐시 없음', null],
  ['8일 지난 캐시', cachedBody(asOfDaysAgo(8))],
  ['깨진 캐시', '{"holdings":'],
] as Array<[string, string | null]>)('보유 누락 + %s면 보유를 사용할 수 없다', async (_label, raw) => {
  if (raw !== null) await cache.put(KEY, raw)
  kisBody = bodyWith([])
  const response = await request()
  expect(response.status).toBe(200)
  expect(await bodyOf(response)).toMatchObject({ holdings: [], holdingsSource: null, holdingsAsOf: null, holdingsFallback: false, holdingsUnavailable: true, holdingsPartialWarning: false })
})
it('보유 0·주식평가 0인 현금 전용 계좌는 누락이 아니다', async () => {
  kisBody = bodyWith([], { scts_evlu_amt: '0', evlu_amt_smtl_amt: '0', tot_evlu_amt: '1,900,000', nass_amt: '1,900,000', pchs_amt_smtl_amt: '0', evlu_pfls_smtl_amt: '0', asst_icdc_amt: '0', asst_icdc_erng_rt: '0' })
  const response = await request()
  expect(response.status).toBe(200)
  expect(await bodyOf(response)).toMatchObject({ holdings: [], holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: false })
  expect(await cache.get(KEY)).toBeNull()
})
it('KIS 보유가 있으면 KIS 보유로 응답하고 캐시에 저장한다', async () => {
  const response = await request()
  expect(response.status).toBe(200)
  const body = await bodyOf(response)
  expect(body).toMatchObject({ holdings: [normalized], holdingsSource: 'kis', holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: false })
  expect(body.holdingsAsOf).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  expect(JSON.parse((await cache.get(KEY))!)).toMatchObject({ holdings: [normalized], stockEvaluationWon: 800000, asOf: body.holdingsAsOf })
})
it('보유 캐시는 604800초 TTL로 저장한다', async () => {
  const put = vi.spyOn(cache, 'put')
  await request()
  expect(put.mock.calls.find(([key]) => key === KEY)?.[2]).toEqual({ expirationTtl: 604800 })
})
it('보유 합계가 요약과 5% 이상 다르면 경고하고 대체·저장하지 않는다', async () => {
  kisBody = bodyWith([{ ...holding, evlu_amt: '700,000' }])
  const put = vi.spyOn(cache, 'put')
  const response = await request()
  expect(response.status).toBe(200)
  expect(await bodyOf(response)).toMatchObject({ holdingsSource: 'kis', holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: true })
  expect(put.mock.calls.some(([key]) => key === KEY)).toBe(false)
})
