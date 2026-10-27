import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { CONFIRMED_REJECTION_CODES, isConfirmedRejection } from '../../../src/domain/trading/order-codes.ts'
import { targetExists } from '../../../src/infra/portfolio/assignment-repository.ts'
import { createOrderRoutes } from '../../../src/infra/trading/order-routes.ts'
import { fakeClaimDb } from './fake-claim-db.ts'
import { pinOpenMarket } from './market-time'

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({ targetExists: vi.fn() }))

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const fresh = () => new Date().toISOString()

function setup(kisHandler: (url: string) => Response, resolveNull = false) {
  vi.mocked(targetExists).mockResolvedValue(true)
  const { db } = fakeClaimDb()
  const client = {
    accountNumber: '1234567801', hashkey: async () => 'h',
    request: async (path: string, options: { query?: Record<string, string> }) => kisHandler(`${path}?${new URLSearchParams(options.query ?? {}).toString()}`),
  }
  const app = new Hono<{ Bindings: Env }>().route('/api', createOrderRoutes({
    fetchFn: (async () => { throw new Error('no real calls') }) as typeof fetch,
    resolveAccount: resolveNull ? async () => null : async () => client as never,
  }))
  return (path: string, body: unknown) => app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, { DB: db } as unknown as Env)
}
const base = { requestId: 'x', code: '005930', quantity: 1, side: 'buy' as const, orderType: 'ioc' as const, checkAt: fresh(), checkQty: 1 }
const quotesOk = (url: string) => url.includes('asking-price') ? ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
  : url.includes('inquire-psbl-order') ? ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } }) : ok({ rt_cd: '0', output: { ODNO: '7' } })

describe('확정 거부 코드 공유 목록', () => {
  pinOpenMarket()

  it('서버가 확정 거부로 내는 코드가 모두 공유 목록에 있다', async () => {
    const codes: string[] = []
    const put = async (path: string, body: unknown, handler: (url: string) => Response = quotesOk, nullAccount = false) => {
      const res = await setup(handler, nullAccount)(path, body)
      const json = (await res.json()) as { code?: string }
      if (typeof json.code === 'string') codes.push(json.code)
      return res
    }
    let res = await put('/api/accounts/a1/products/01/orders', { ...base, quantity: 0 }); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders/check', { requestId: 'c', code: 'x', side: 'buy', orderType: 'ioc', quantity: 1 }); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders', { ...base, checkAt: '2020-01-01T00:00:00Z' }); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders', { ...base, checkQty: 0 }); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders', base, () => ok({ rt_cd: '0', output: { ord_psbl_qty: '0', ord_psbl_amt: '0' } })); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders', base, (url) => url.includes('inquire-psbl-order') ? ok({ rt_cd: '0', output: { ord_psbl_qty: '0', ord_psbl_amt: '0' } }) : quotesOk(url)); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders/check', { requestId: 'c2', code: '005930', side: 'buy', orderType: 'ioc', quantity: 3 }, () => ok({ rt_cd: '0', output: { ord_psbl_qty: '2', ord_psbl_amt: '20000' } })); expect(res.status).toBe(400)
    const sell = { requestId: 's1', code: '005930', quantity: 1, side: 'sell' as const, orderType: 'ioc' as const, checkAt: fresh(), checkQty: 1 }
    res = await put('/api/accounts/a1/products/01/orders', { ...sell, requestId: 's2' }, (url) => url.includes('asking-price') ? ok({ rt_cd: '0', output1: {} }) : quotesOk(url)); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders', base, () => ok({}), true); expect(res.status).toBe(404)
    vi.setSystemTime(new Date('2026-10-26T10:00:00Z'))
    res = await put('/api/accounts/a1/products/01/orders', { ...base, requestId: 'm1' }); expect(res.status).toBe(400)
    vi.setSystemTime(new Date('2026-10-26T01:00:00Z'))
    res = await put('/api/accounts/a1/products/01/orders', { ...base, requestId: 'm2' }, (url) => url.includes('order-cash') ? ok({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '잔고가 부족합니다' }) : quotesOk(url)); expect(res.status).toBe(400)
    res = await put('/api/accounts/a1/products/01/orders', { ...base, requestId: 'm3' }, (url) => url.includes('order-cash') ? ok({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '가능수량을 초과했습니다' }) : quotesOk(url)); expect(res.status).toBe(400)
    for (const code of codes) {
      expect(CONFIRMED_REJECTION_CODES as readonly string[]).toContain(code)
      expect(isConfirmedRejection(code)).toBe(true)
    }
    expect(codes).toContain('MARKET_CLOSED')
    expect(codes).toContain('ORDER_QUANTITY_EXCEEDED')
    expect(codes).toContain('INSUFFICIENT_BALANCE')
    expect(codes).toContain('EXCEEDS_AVAILABLE')
  })

  it('목록 밖 코드(불명·처리중·장애)는 확정 거부로 나오지 않는다', () => {
    for (const code of ['ORDER_UNKNOWN', 'DUPLICATE_REQUEST', 'ORDER_CHECK_FAILED', 'ORDER_STORAGE_UNAVAILABLE', '', undefined]) {
      expect(isConfirmedRejection(code)).toBe(false)
    }
    expect(isConfirmedRejection('INVALID_ORDER')).toBe(true)
    expect(isConfirmedRejection('NO_QUOTE')).toBe(true)
  })
})
