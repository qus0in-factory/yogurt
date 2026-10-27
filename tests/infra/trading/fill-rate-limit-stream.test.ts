import { describe, expect, it } from 'vitest'
import { MONDAY, readEvents, seed, setup } from './stream-helpers'

const rate = () => new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'EGW00201' }), { status: 200 })
// part행: 상태 partial이라 스트림이 종료되지 않고 폴링 간격을 관찰할 수 있다.
const partial = () => new Response(JSON.stringify({ rt_cd: '0', output1: [{ odno: 'O-1', ord_qty: '10', tot_ccld_qty: '4', rmn_qty: '6', cncl_yn: 'N' }] }), { status: 200 })

describe('체결 스트림의 일시 제한 처리', () => {
  it('제한 응답이면 rate_limited 이벤트를 보내고 다음 폴링 주기를 늘린다(상한 20초)', async () => {
    const { db, open, getSleepMs } = setup(rate, MONDAY, 70000)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(events.map((event) => event.event)).toEqual(['fill', 'done'])
    expect(JSON.parse(events[0].data)).toMatchObject({ orderId: 'O-1', status: 'rate_limited' })
    expect(getSleepMs()).toEqual([10000, 20000, 20000, 20000])
  })

  it('제한이 없으면 기본 5초 간격을 유지한다', async () => {
    const { db, open, getSleepMs } = setup(partial, MONDAY, 5500)
    await seed(db, 'a1:01:r1', 'O-1')
    await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(getSleepMs()).toEqual([5000, 5000])
  })
})
