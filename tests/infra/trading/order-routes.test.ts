import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { targetExists } from '../../../src/infra/portfolio/assignment-repository.ts'
import { createOrderRoutes } from '../../../src/infra/trading/order-routes.ts'
import { fakeClaimDb } from './fake-claim-db.ts'
import { pinOpenMarket } from './market-time.ts';

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({ targetExists: vi.fn() }))

export const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

export function fakeAccount(kisHandler: (url: string) => Response) {
  return {
    accountNumber: '1234567801',
    hashkey: vi.fn(async () => 'h'),
    request: vi.fn(async (path: string, options: { query?: Record<string, string> }) => kisHandler(`${path}?${new URLSearchParams(options.query ?? {}).toString()}`)),
  }
}

export function setupRoutes(kisHandler: (url: string) => Response, active = true, claimFailures: { update?: boolean; failOn?: string } = {}) {
  vi.mocked(targetExists).mockResolvedValue(active)
  const client = fakeAccount(kisHandler)
  const { db } = fakeClaimDb(claimFailures)
  const app = new Hono<{ Bindings: Env }>().route('/api', createOrderRoutes({
    fetchFn: (async () => { throw new Error('no real calls') }) as typeof fetch,
    resolveAccount: async () => client,
  }))
  const env = { DB: db } as unknown as Env
  const call = (path: string, body: unknown) => app.request(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }, env)
  return { call, client }
}

export const fresh = () => new Date().toISOString()
export const orderCalls = (client: { request: { mock: { calls: unknown[][] } } }, part: string) =>
  client.request.mock.calls.filter(([p]) => String(p).includes(part))

describe('주문 확인 조회 라우트', () => {
  pinOpenMarket()
  it('잘못된 본문·상품 코드 불일치·비활성 상품은 400이다', async () => {
    const { call } = setupRoutes(() => ok({}))
    expect((await call('/api/accounts/a1/products/01/orders/check', { code: '', side: 'buy' })).status).toBe(400)
    const mismatch = { requestId: 'm0', code: '005930', quantity: 1, side: 'buy', checkAt: fresh(), checkQty: 1, productCode: '22' }
    expect((await call('/api/accounts/a1/products/01/orders', mismatch)).status).toBe(400)
    const { call: call2 } = setupRoutes(() => ok({}), false)
    const inactive = { requestId: 'm2', code: '005930', quantity: 1, side: 'buy', checkAt: fresh(), checkQty: 1 }
    expect((await call2('/api/accounts/a1/products/01/orders', inactive)).status).toBe(400)
  })

  it('확인 조회는 KIS를 1회만 호출한다', async () => {
    const { call, client } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '3', ord_psbl_amt: '30000' } }))
    const res = await call('/api/accounts/a1/products/01/orders/check', { requestId: 'c1', code: '005930', side: 'buy', orderType: 'ioc', quantity: 2, price: 10000 })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ availableQty: 3, availableWon: 30000 })
    expect(client.request).toHaveBeenCalledTimes(1)
  })

  it('확인 요청에 수량이 있으면 400이 아니다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } }))
    const res = await call('/api/accounts/a1/products/01/orders/check', { requestId: 'c2', code: '005930', side: 'buy', orderType: 'ioc', quantity: 5, price: 10000 })
    expect(res.status).toBe(200)
  })
})
