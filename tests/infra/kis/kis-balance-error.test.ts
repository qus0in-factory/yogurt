// @vitest-environment node
import { Hono, type Context } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'

const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
let credRow: Record<string, string> = {}
let balanceResponse: () => Response = () => new Response('upstream unavailable', { status: 503 })

beforeAll(async () => {
  credRow = { access_key_enc: await encryptText('PROTECT-AK', envKey), secret_key_enc: await encryptText('PROTECT-SK', envKey), account_number: '12345678', product_code: '29' }
})
const credsDb = (row: unknown) => ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) }) as unknown as D1Database
const fetchFn = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/oauth2/')
  ? new Response(JSON.stringify({ access_token: 'PROTECT-TOKEN', expires_in: 3600 }), { status: 200 })
  : balanceResponse())
const request = async () => {
  const app = new Hono<{ Bindings: Env }>()
    .get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch))
  return app.request('/api/accounts/a1/products/29/balance', { method: 'GET' },
    { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: createFakeKv() } as unknown as Env)
}

beforeEach(() => {
  vi.clearAllMocks()
  balanceResponse = () => new Response('upstream unavailable', { status: 503 })
})

describe('kis 잔고 오류 전파', () => {
  it('KIS가 JSON이 아닌 오류를 주면 502에 code 없이 응답한다', async () => {
    const response = await request()
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'kis request failed' })
  })
  it('KIS 401이 반복되면 토큰 무효화 재시도 후 502에 code를 담는다', async () => {
    balanceResponse = () => new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'EGW00201', msg1: '권한이 없습니다' }), { status: 401 })
    const response = await request()
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'kis request failed', code: 'EGW00201' })
    const balanceCalls = fetchFn.mock.calls.filter(([url]) => !String(url).includes('/oauth2/'))
    expect(balanceCalls).toHaveLength(2)
  })
})
