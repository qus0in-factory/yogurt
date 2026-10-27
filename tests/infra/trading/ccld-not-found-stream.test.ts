import { describe, expect, it } from 'vitest'
import { MONDAY, ok, readEvents, seed, setup } from './stream-helpers'

const otherRow = () => ok({ rt_cd: '0', output1: [{ odno: 'O-X', ord_qty: '10', tot_ccld_qty: '0', rmn_qty: '10', cncl_yn: 'N' }] })

describe('체결 스트림 not_found 전송', () => {
  it('주문 번호를 못 찾으면 not_found 이벤트로 보내고 계속 폴링 후 done으로 닫는다', async () => {
    const { db, open, getSleeps } = setup(otherRow, MONDAY, 5500)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(events.map((event) => event.event)).toEqual(['fill', 'done'])
    expect(JSON.parse(events[0].data)).toMatchObject({ orderId: 'O-1', status: 'not_found' })
    expect(getSleeps()).toBe(2)
  })
})
