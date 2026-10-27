import { describe, expect, it } from 'vitest'
import { ccldRow, MONDAY, ok, readEvents, seed, setup, SUNDAY } from './stream-helpers'

describe('체결 스트림 가드', () => {
  it('잘못된 orderIds는 400이다', async () => {
    const { open } = setup(() => ok({}), MONDAY)
    expect((await open('/api/accounts/a1/products/01/orders/stream?orderIds=')).status).toBe(400)
    expect((await open('/api/accounts/a1/products/01/orders/stream?orderIds=' + Array.from({ length: 8 }, (_, i) => `O-${i}`).join(','))).status).toBe(400)
    expect((await open('/api/accounts/a1/products/01/orders/stream?orderIds=BAD!CODE')).status).toBe(400)
  })

  it('다른 계좌의 주문은 조회가 거부된다', async () => {
    const { db, open, client } = setup(() => ok({}), MONDAY)
    await seed(db, 'a1:01:r1', 'O-1')
    const res = await open('/api/accounts/a2/products/01/orders/O-1/status')
    expect(res.status).toBe(404)
    expect(client.request).not.toHaveBeenCalled()
  })

  it('장 마감 중에는 한 번만 조회하고 닫는다', async () => {
    const { db, client, open, getSleeps } = setup(() => ok({ rt_cd: '0', output1: [ccldRow('0', '10')] }), SUNDAY)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(events.map((e) => e.event)).toEqual(['fill', 'done'])
    expect(client.request.mock.calls.filter(([p]) => String(p).includes('inquire-daily'))).toHaveLength(1)
    expect(getSleeps()).toBe(0)
  })
})
