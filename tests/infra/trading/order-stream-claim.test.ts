import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { targetExists } from '../../../src/infra/portfolio/assignment-repository.ts'
import { createOrderRoutes } from '../../../src/infra/trading/order-routes.ts'
import { claimOrder, findClaimByOrder, markSending, markSucceeded } from '../../../src/infra/trading/order-idempotency.ts'
import { fakeClaimDb } from './fake-claim-db.ts'
import { pinOpenMarket } from './market-time.ts'
import { ccldRow, ok, readEvents, MONDAY } from './stream-helpers.ts'

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({ targetExists: vi.fn() }))

function setup(kis: (url: string) => Response) {
  vi.mocked(targetExists).mockResolvedValue(true)
  let t = MONDAY
  const client = { accountNumber: '1234567801', hashkey: async () => 'h', request: vi.fn(async (p: string, o: { query?: Record<string, string> }) => kis(`${p}?${new URLSearchParams(o.query ?? {}).toString()}`)) }
  const { db, rows } = fakeClaimDb()
  const app = new Hono<{ Bindings: Env }>().route('/api', createOrderRoutes({ fetchFn: (async () => { throw new Error('no real') }) as typeof fetch, resolveAccount: async () => client as never, sleep: async (ms: number) => { t += ms }, now: () => t, maxMs: 12000 }))
  return { db, rows, app, env: { DB: db } as unknown as Env }
}

const kisOk = (url: string) => url.includes('inquire-psbl-order') ? ok({ rt_cd: '0', output: { ord_psbl_qty: '5', ord_psbl_amt: '50000' } }) : url.includes('asking-price') ? ok({ rt_cd: '0', output1: { askp1: '50000', bidp1: '49000' } }) : url.includes('inquire-daily') ? ok({ rt_cd: '0', output1: [{ ...ccldRow('10', '0'), odno: '7' }] }) : ok({ rt_cd: '0', output: { ODNO: '7' } })
const body = { requestId: 'rx', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc', price: 10000, checkAt: new Date().toISOString(), checkQty: 5 }

describe('스트림 클레임 저장과 조회', () => {
  pinOpenMarket()
  it('주문 실행이 account·product·주문번호를 저장하고 스트림이 200이다', async () => {
    const { db, app, env } = setup(kisOk)
    const post = await app.request('/api/accounts/a1/products/01/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, env)
    expect(post.status).toBe(200)
    const found = await findClaimByOrder(db, 'a1', '01', '7')
    const raw = found as unknown as Record<string, unknown>
    expect(raw.order_no ?? raw.orderNo).toBeTruthy()
    const get = await app.request('/api/accounts/a1/products/01/orders/stream?orderIds=7', { method: 'GET' }, env)
    expect(get.status).toBe(200)
    expect((await readEvents(get)).map((e) => e.event)).toEqual(['fill', 'done'])
  })
  it('열이 빈 기존 행도 requestId 접두사로 찾아 스트림이 200이다', async () => {
    const { db, rows, app, env } = setup(kisOk)
    await claimOrder(db, 'a1:01:old')
    await markSending(db, 'a1:01:old')
    await markSucceeded(db, 'a1:01:old', 'O-LEG', 't', 'a1', '01')
    rows.get('a1:01:old')!.account_id = null
    rows.get('a1:01:old')!.product_code = null
    expect(await findClaimByOrder(db, 'a1', '01', 'O-LEG')).not.toBeNull()
    const get = await app.request('/api/accounts/a1/products/01/orders/stream?orderIds=O-LEG', { method: 'GET' }, env)
    expect(get.status).toBe(200)
  })
})
