// @vitest-environment node
import { Hono } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { KIS_NAME_FIELD } from '../../../src/infra/kis/kis-stock-lookup.ts'
import { createStockRoutes } from '../../../src/infra/stocks/stock-routes.ts'
import { createFakeKv } from '../fakes/kv.ts'

const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
let credRow: Record<string, string> = {}
let kisBody: unknown = { rt_cd: '0', output: { [KIS_NAME_FIELD]: '  삼성전자  ' } }
let kisStatus = 200

beforeAll(async () => {
  credRow = {
    access_key_enc: await encryptText('PROTECT-AK', envKey),
    secret_key_enc: await encryptText('PROTECT-SK', envKey),
    account_number: '12345678', product_code: '01',
  }
})

const createDb = (hasAccount: boolean) => ({
  prepare: (sql: string) => ({
    all: async () => ({ results: hasAccount && sql.includes('FROM accounts') ? [{ id: 'acc-1', alias: '주계좌', owner: '홍길동', account_number: '12345678', created_at: '2026-10-01' }] : [] }),
    bind: () => ({ all: async () => ({ results: [{ product_code: '01', start_date: null, min_target_amount_won: null, max_target_amount_won: null }] }), first: async () => credRow }),
  }),
}) as unknown as D1Database

const fetchFn = vi.fn(async (input: RequestInfo | URL) =>
  String(input).includes('/oauth2/') ? new Response(JSON.stringify({ access_token: 'PROTECT-TOKEN', expires_in: 3600 }), { status: 200 }) : new Response(JSON.stringify(kisBody), { status: kisStatus }))

const request = (path: string, db: D1Database) => {
  const app = new Hono<{ Bindings: Env }>()
  app.route('/api', createStockRoutes(fetchFn as unknown as typeof fetch))
  const env = { DB: db, ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: createFakeKv() } as unknown as Env
  return app.request(path, { method: 'GET' }, env)
}

beforeEach(() => {
  vi.clearAllMocks()
  kisStatus = 200
  kisBody = { rt_cd: '0', output: { [KIS_NAME_FIELD]: '  삼성전자  ' } }
})

describe('GET /api/stocks/:code', () => {
  it('정상 조회 시 200과 trim된 종목명을 반환하고 비밀값을 노출하지 않는다', async () => {
    const res = await request('/api/stocks/005930', createDb(true))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ code: '005930', name: '삼성전자' })
    expect(JSON.stringify(body)).not.toContain('PROTECT-')
  })

  it('rt_cd가 0이 아니면 404 STOCK_NOT_FOUND를 반환한다', async () => {
    kisBody = { rt_cd: '1', msg_cd: 'EGW00001', output: null }
    const res = await request('/api/stocks/999999', createDb(true))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'stock not found', code: 'STOCK_NOT_FOUND' })
  })

  it('KIS 장애 시 503 STOCK_LOOKUP_UNAVAILABLE, 계좌 미존재 시 503 NO_KIS_ACCOUNT를 반환한다', async () => {
    kisStatus = 500
    expect((await request('/api/stocks/005930', createDb(true))).status).toBe(503)
    const noAccRes = await request('/api/stocks/005930', createDb(false))
    expect(noAccRes.status).toBe(503)
    expect(await noAccRes.json()).toEqual({ error: 'no kis account configured', code: 'NO_KIS_ACCOUNT' })
  })

  it('잘못된 종목코드는 400 INVALID_STOCK_CODE를 반환한다', async () => {
    const res = await request('/api/stocks/bad!code', createDb(true))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid stock code', code: 'INVALID_STOCK_CODE' })
    expect(fetchFn).not.toHaveBeenCalled()
  })
})
