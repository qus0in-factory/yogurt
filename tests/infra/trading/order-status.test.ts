import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { claimOrder, markSending, markSucceeded } from '../../../src/infra/trading/order-idempotency.ts'
import { targetExists } from '../../../src/infra/portfolio/assignment-repository.ts'
import { createOrderRoutes } from '../../../src/infra/trading/order-routes.ts'
import { fakeClaimDb } from './fake-claim-db.ts'
import { pinOpenMarket } from './market-time'

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({ targetExists: vi.fn() }))

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function setup(kisHandler: (url: string) => Response) {
  vi.mocked(targetExists).mockResolvedValue(true)
  const { db } = fakeClaimDb()
  const app = new Hono<{ Bindings: Env }>().route('/api', createOrderRoutes({
    fetchFn: (async () => { throw new Error('no real calls') }) as typeof fetch,
    resolveAccount: async () => ({ accountNumber: '12345678', hashkey: async () => 'h', request: kisHandler } as never),
  }))
  const env = { DB: db } as unknown as Env
  return { db, call: (path: string) => app.request(path, { method: 'GET' }, env) }
}

async function seedSucceeded(db: D1Database, id: string, orderNo: string, accountId: string, productCode: string) {
  await claimOrder(db, id)
  await markSending(db, id)
  await markSucceeded(db, id, orderNo, '2026-10-26T00:00:00Z', accountId, productCode)
}

describe('주문 체결 상태 조회', () => {
  pinOpenMarket()

  it('전량 체결이면 filled와 수량을 돌려준다', async () => {
    const { call, db } = setup((url) => url.includes('asking-price')
      ? ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } })
      : ok({ rt_cd: '0', output1: [{ odno: 'O-7', ord_qty: '10', tot_ccld_qty: '10', rmn_qty: '0', cncl_yn: 'N' }] }))
    await seedSucceeded(db, 'a1:01:req-9', 'O-7', 'a1', '01')
    const res = await call('/api/accounts/a1/products/01/orders/O-7/status')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ orderId: 'O-7', status: 'filled', orderedQty: 10, filledQty: 10, remainingQty: 0 })
  })

  it('다른 계좌의 주문 번호는 조회가 거부된다', async () => {
    const { call, db } = setup(() => ok({}))
    await seedSucceeded(db, 'a1:01:req-9', 'O-7', 'a1', '01')
    const res = await call('/api/accounts/a2/products/01/orders/O-7/status')
    expect(res.status).toBe(404)
  })

  it('KIS 조회 실패는 503이고 호가·잔고 경로와 섞이지 않는다', async () => {
    const { call, db } = setup(() => ok({ rt_cd: '1', msg_cd: 'EGW00123', msg1: '만료' }))
    await seedSucceeded(db, 'a1:01:req-8', 'O-8', 'a1', '01')
    const res = await call('/api/accounts/a1/products/01/orders/O-8/status')
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ code: 'ORDER_STATUS_UNAVAILABLE' })
  })
})
