import { describe, expect, it } from 'vitest'
import { ccldRow, MONDAY, ok, readEvents, seed, setup, SUNDAY } from './stream-helpers'
describe('체결 SSE 스트림', () => {
  it('상태가 바뀔 때만 이벤트를 보내고 전부 완료되면 닫는다', async () => {
    let polls = 0
    const { db, client, open, getSleeps } = setup((url) => {
      if (!url.includes('inquire-daily')) return ok({})
      polls += 1
      return polls >= 3 ? ok({ rt_cd: '0', output1: [ccldRow('10', '0')] }) : ok({ rt_cd: '0', output1: [ccldRow('0', '10')] })
    }, MONDAY)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(events.map((e) => e.event)).toEqual(['fill', 'fill', 'done'])
    expect(JSON.parse(events[0].data)).toMatchObject({ orderId: 'O-1', status: 'open' })
    expect(JSON.parse(events[1].data)).toMatchObject({ orderId: 'O-1', status: 'filled', filledQty: 10 })
    expect(polls).toBe(3)
    expect(getSleeps()).toBe(2)
    expect(client.request.mock.calls.filter(([p]) => String(p).includes('inquire-daily'))).toHaveLength(3)
  })

  it('잔량 0·체결 4 IOC 종료는 closed_partial로 보내고 done에 포함한다', async () => {
    const { db, open } = setup(() => ok({ rt_cd: '0', output1: [ccldRow('4', '0')] }), MONDAY, 9000)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(events.map((e) => e.event)).toEqual(['fill', 'done'])
    expect(JSON.parse(events[0].data)).toMatchObject({ orderId: 'O-1', status: 'closed_partial', filledQty: 4, remainingQty: 0 })
    expect(JSON.parse(events[1].data)).toEqual({ finished: ['O-1'] })
  })

  it('최대 유지 시간이 지나면 닫는다', async () => {
    const { db, open, getSleeps } = setup(() => ok({ rt_cd: '0', output1: [ccldRow('0', '10')] }), MONDAY, 9000)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    expect(events.at(-1)?.event).toBe('done')
    expect(getSleeps()).toBe(2)
  })

  it('조회 실패는 unknown 이벤트로 보내고 계속 시도한다', async () => {
    let polls = 0
    const { db, open } = setup((url) => {
      if (!url.includes('inquire-daily')) return ok({})
      polls += 1
      if (polls === 1) throw new Error('down')
      return ok({ rt_cd: '0', output1: [ccldRow('0', '10')] })
    }, MONDAY, 9000)
    await seed(db, 'a1:01:r1', 'O-1')
    const events = await readEvents(await open('/api/accounts/a1/products/01/orders/stream?orderIds=O-1'))
    const fills = events.filter((e) => e.event === 'fill')
    expect(fills).toHaveLength(2)
    expect(JSON.parse(fills[0].data)).toMatchObject({ status: 'unknown' })
    expect(JSON.parse(fills[1].data)).toMatchObject({ status: 'open' })
  })
})
