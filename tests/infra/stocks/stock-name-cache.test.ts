// @vitest-environment node
import { Hono } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { KIS_NAME_FIELD } from '../../../src/infra/kis/kis-stock-lookup.ts'
import { STOCK_NAME_TTL_SECONDS, stockNameKey } from '../../../src/infra/stocks/stock-name-store.ts'
import { createStockRoutes } from '../../../src/infra/stocks/stock-routes.ts'
import { createFakeKv } from '../fakes/kv.ts'

const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
let credRow: Record<string, string> = {}
let kisBody: unknown = { rt_cd: '0', output: { [KIS_NAME_FIELD]: '삼성전자' } }
let kisStatus = 200

beforeAll(async () => {
  credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '01' }
})

const createDb = () => ({
  prepare: (sql: string) => ({
    all: async () => ({ results: sql.includes('FROM accounts') ? [{ id: 'acc-1', alias: '주계좌', owner: '홍길동', account_number: '12345678', created_at: '2026-10-01' }] : [] }),
    bind: () => ({ all: async () => ({ results: [{ product_code: '01', start_date: null, min_target_amount_won: null, max_target_amount_won: null }] }), first: async () => credRow }),
  }),
}) as unknown as D1Database

const fetchFn = vi.fn(async (input: RequestInfo | URL) =>
  String(input).includes('/oauth2/') ? new Response(JSON.stringify({ access_token: 'PROTECT-TOKEN', expires_in: 3600 }), { status: 200 }) : new Response(JSON.stringify(kisBody), { status: kisStatus }))

const callWithKv = (path: string, cache: KVNamespace) => {
  const app = new Hono<{ Bindings: Env }>()
  app.route('/api', createStockRoutes(fetchFn as unknown as typeof fetch))
  const env = { DB: createDb(), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: cache } as unknown as Env
  return app.request(path, { method: 'GET' }, env)
}

beforeEach(() => {
  vi.clearAllMocks()
  kisStatus = 200
  kisBody = { rt_cd: '0', output: { [KIS_NAME_FIELD]: '삼성전자' } }
})

describe('종목명 KV 캐시 (stock-name:{CODE})', () => {
  it('KV 캐시 적중 시 KIS를 호출하지 않고 200으로 반환한다', async () => {
    const cache = createFakeKv()
    await cache.put(stockNameKey('005930'), JSON.stringify({ name: '캐시삼성전자', asOf: '2026-10-26 12:00:00' }))
    const res = await callWithKv('/api/stocks/005930', cache)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ code: '005930', name: '캐시삼성전자' })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('미적중 조회 성공(200) 시 TTL 604800초(1주일)로 {name, asOf}를 KV에 저장한다', async () => {
    const cache = createFakeKv()
    const putSpy = vi.spyOn(cache, 'put')
    expect((await callWithKv('/api/stocks/005930', cache)).status).toBe(200)
    expect(putSpy).toHaveBeenCalledWith('stock-name:005930', expect.any(String), { expirationTtl: 604800 })
    expect(STOCK_NAME_TTL_SECONDS).toBe(604800)
    const saved = JSON.parse(await cache.get('stock-name:005930') ?? '{}') as { name?: string; asOf?: string }
    expect(saved.name).toBe('삼성전자')
    expect(typeof saved.asOf).toBe('string')
  })

  it('404·503은 캐시하지 않으며 KV 쓰기 실패가 발생해도 200 응답을 유지한다', async () => {
    const cache = createFakeKv()
    const putSpy = vi.spyOn(cache, 'put')
    kisBody = { rt_cd: '1', output: null }
    expect((await callWithKv('/api/stocks/999999', cache)).status).toBe(404)
    expect(putSpy).not.toHaveBeenCalledWith('stock-name:999999', expect.anything(), expect.anything())
    kisStatus = 500
    expect((await callWithKv('/api/stocks/005930', cache)).status).toBe(503)
    expect(putSpy).not.toHaveBeenCalledWith('stock-name:005930', expect.anything(), expect.anything())
    kisStatus = 200; kisBody = { rt_cd: '0', output: { [KIS_NAME_FIELD]: '삼성전자' } }
    putSpy.mockRejectedValueOnce(new Error('kv put failed'))
    const okRes = await callWithKv('/api/stocks/005930', cache)
    expect(okRes.status).toBe(200)
    expect(await okRes.json()).toEqual({ code: '005930', name: '삼성전자' })
  })
})
