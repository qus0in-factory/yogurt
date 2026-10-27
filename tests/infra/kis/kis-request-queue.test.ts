import { describe, expect, it } from 'vitest'
import { createKisQueue } from '../../../src/infra/kis/kis-request-queue.ts'

describe('KIS 공용 호출 큐', () => {
  it('직렬로 실행하고 최소 간격을 둔다', async () => {
    let now = 1000
    const sleeps: number[] = []
    const queue = createKisQueue({ minIntervalMs: 200, now: () => now, sleep: async (ms: number) => { sleeps.push(ms); now += ms } })
    const order: string[] = []
    const task = (name: string) => async () => { order.push(`${name}@${now}`) }
    await Promise.all([queue.run('read', task('a')), queue.run('read', task('b')), queue.run('read', task('c'))])
    expect(order).toEqual(['a@1000', 'b@1200', 'c@1400'])
    expect(sleeps).toEqual([200, 200])
  })
  it('주문이 읽기·체결보다 앞서고 체결이 뒤로 밀린다', async () => {
    let now = 1000
    const queue = createKisQueue({ minIntervalMs: 200, now: () => now, sleep: async (ms: number) => { now += ms } })
    const order: string[] = []
    const task = (name: string) => async () => { order.push(name) }
    await Promise.all([queue.run('read', task('read')), queue.run('fill', task('fill')), queue.run('order', task('order'))])
    expect(order).toEqual(['read', 'order', 'fill'])
  })
  it('실패해도 다음 호출이 막히지 않는다', async () => {
    const queue = createKisQueue({ minIntervalMs: 0 })
    await expect(queue.run('read', async () => { throw new Error('down') })).rejects.toThrow('down')
    await expect(queue.run('read', async () => 'ok')).resolves.toBe('ok')
  })
})
