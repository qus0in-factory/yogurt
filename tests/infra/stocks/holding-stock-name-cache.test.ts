// @vitest-environment node
import { Hono, type Context } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { STOCK_NAME_TTL_SECONDS } from '../../../src/infra/stocks/stock-name-store.ts'
import { createStockRoutes } from '../../../src/infra/stocks/stock-routes.ts'
import { createFakeKv } from '../fakes/kv.ts'

const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
let credRow: Record<string, string> = {}
const makeHolding = (pdno: string, prdt_name: string) => ({
  pdno, prdt_name, hldg_qty: '10', pchs_avg_pric: '70,000', pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28',
})
const summaryRow = {
  dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000', pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000', asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84',
}
let balanceBody: unknown

beforeAll(async () => {
  credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '29' }
})

const createDb = () => ({
  prepare: (sql: string) => ({
    all: async () => ({ results: sql.includes('FROM accounts') ? [{ id: 'a1', alias: '주계좌', owner: '홍길동', account_number: '12345678', created_at: '2026-10-01' }] : [] }),
    bind: () => ({ all: async () => ({ results: [{ product_code: '29', start_date: null, min_target_amount_won: null, max_target_amount_won: null }] }), first: async () => credRow, run: async () => ({ success: true }) }),
  }),
}) as unknown as D1Database

const fetchFn = vi.fn(async (input: RequestInfo | URL) =>
  new Response(JSON.stringify(String(input).includes('/oauth2/') ? { access_token: 'PROTECT-TOKEN', expires_in: 3600 } : balanceBody), { status: 200 }))

const createTestApp = (cache: KVNamespace) => {
  const app = new Hono<{ Bindings: Env }>()
  app.get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch))
  app.route('/api', createStockRoutes(fetchFn as unknown as typeof fetch))
  const env = { DB: createDb(), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: cache } as unknown as Env
  return (path: string) => app.request(path, { method: 'GET' }, env)
}

beforeEach(() => {
  vi.clearAllMocks()
  balanceBody = { rt_cd: '0', msg_cd: '0', msg1: 'ok', output1: [makeHolding('005930', '삼성전자'), makeHolding('133690', '   ')], output2: [summaryRow] }
})

describe('현황 보유 종목명 KV 캐시 연동', () => {
  it('현황 조회 시 이름 있는 보유 종목만 저장하고, 같은 이름 재조회 시 쓰기를 생략하며, 종목 조회 시 KIS를 호출하지 않는다', async () => {
    const cache = createFakeKv()
    const putSpy = vi.spyOn(cache, 'put')
    const call = createTestApp(cache)

    expect((await call('/api/accounts/a1/products/29/balance')).status).toBe(200)
    expect(STOCK_NAME_TTL_SECONDS).toBe(604800)
    expect(putSpy).toHaveBeenCalledWith('stock-name:005930', expect.any(String), { expirationTtl: 604800 })
    expect(putSpy).not.toHaveBeenCalledWith('stock-name:133690', expect.anything(), expect.anything())

    putSpy.mockClear()
    expect((await call('/api/accounts/a1/products/29/balance')).status).toBe(200)
    expect(putSpy).not.toHaveBeenCalledWith('stock-name:005930', expect.anything(), expect.anything())

    fetchFn.mockClear()
    const stockRes = await call('/api/stocks/005930')
    expect(stockRes.status).toBe(200)
    expect(await stockRes.json()).toEqual({ code: '005930', name: '삼성전자' })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('KV 쓰기가 실패해도 현황 조회 200 응답을 유지한다', async () => {
    const cache = createFakeKv()
    const origPut = cache.put.bind(cache)
    vi.spyOn(cache, 'put').mockImplementation(async (key, val, opts) => {
      if (key.startsWith('stock-name:')) throw new Error('kv write error')
      return origPut(key, val, opts)
    })
    const call = createTestApp(cache)
    const res = await call('/api/accounts/a1/products/29/balance')
    expect(res.status).toBe(200)
  })
})
