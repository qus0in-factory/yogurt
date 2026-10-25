// @vitest-environment node
import { Hono, type Context } from 'hono'
import { beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month.ts'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'

type Summary = { cash: number; cashSource: 'kis' | 'user' | null; cashAsOf: string | null; cashFallback: boolean; cashUnavailable: boolean }
const KEY = 'cash-last:a1:29'
const DAY = 86400000
const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
const holding = { pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000', pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28' }
const summary = { dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000', pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000', asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84' }
const bodyWithoutCash = () => {
  const row = { ...summary } as Record<string, string>
  delete row.dnca_tot_amt
  return { rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1: [holding], output2: [row] }
}
const cashAt = (days: number) => JSON.stringify({
  cashWon: 5000, asOf: seoulDateTime(new Date(Date.now() - days * DAY)), source: 'kis',
})
let credRow: Record<string, string> = {}
let cache: KVNamespace

beforeAll(async () => {
  credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '29' }
})
const credsDb = (row: unknown) => ({ prepare: () => ({ bind: (..._args: unknown[]) => ({ first: async () => row, run: async () => ({ success: true }) }) }) }) as unknown as D1Database
const fetchFn = vi.fn(async (input: RequestInfo | URL) => new Response(JSON.stringify(String(input).includes('/oauth2/') ? { access_token: 'PROTECT-TOKEN', expires_in: 3600 } : bodyWithoutCash()), { status: 200 }))
const request = () => new Hono<{ Bindings: Env }>()
  .get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch))
  .request('/api/accounts/a1/products/29/balance', { method: 'GET' }, { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: cache } as unknown as Env)
const summaryOf = async (response: Response) => (await response.json() as { summary: Summary }).summary

beforeEach(() => { vi.clearAllMocks(); cache = createFakeKv() })

it('6일 전 asOf 저장값은 대체한다', async () => {
  const raw = cashAt(6)
  await cache.put(KEY, raw)
  const summary = await summaryOf(await request())
  expect(summary).toMatchObject({ cash: 5000, cashSource: 'kis', cashAsOf: JSON.parse(raw).asOf, cashFallback: true, cashUnavailable: false })
})

it('8일 전 asOf 저장값은 대체하지 않고 미확인이다', async () => {
  await cache.put(KEY, cashAt(8))
  const summary = await summaryOf(await request())
  expect(summary).toMatchObject({ cash: 0, cashSource: null, cashAsOf: null, cashFallback: false, cashUnavailable: true })
})
