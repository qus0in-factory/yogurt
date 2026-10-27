import { describe, expect, it, vi } from 'vitest'
import { subscribeFills } from '../../../src/app/trading/fill-stream'

function fakeSource() {
  const listeners = new Map<string, Array<(event: { data: string }) => void>>()
  return {
    listeners,
    addEventListener: vi.fn((type: string, listener: (event: { data: string }) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener])
    }),
    close: vi.fn(),
  }
}

const query = { accountId: 'a/b', productCode: '01', orderIds: ['O-1', 'O-2'] }
const withSource = (s: unknown) => ((url: string) => { void url; return s as never }) as never

describe('체결 스트림 구독', () => {
  it('orderIds를 쿼리에 담아 구독하고 fill을 전달한다', () => {
    const source = fakeSource()
    const seen: unknown[] = []
    let opened = ''
    const create = (url: string) => { opened = url; return source as never }
    const unsubscribe = subscribeFills(query, (u) => { seen.push(u) }, undefined, undefined, create as never)
    expect(opened).toContain('/api/accounts/a%2Fb/products/01/orders/stream?orderIds=O-1%2CO-2')
    source.listeners.get('fill')!.forEach((fn) => fn({ data: JSON.stringify({ orderId: 'O-1', status: 'partial', filledQty: 3, remainingQty: 7 }) }))
    expect(seen).toEqual([{ orderId: 'O-1', status: 'partial', filledQty: 3, remainingQty: 7 }])
    expect(typeof unsubscribe).toBe('function')
  })

  it('done이면 콜백 후 닫고, unsubscribe하면 닫는다', () => {
    const source = fakeSource()
    let done: unknown[] = []
    const unsubscribe = subscribeFills({ accountId: 'a', productCode: '01', orderIds: ['O-1'] }, () => {}, (f) => { done = f }, undefined, withSource(source))
    source.listeners.get('done')!.forEach((fn) => fn({ data: JSON.stringify({ finished: ['O-1'] }) }))
    expect(done).toEqual(['O-1'])
    expect(source.close).toHaveBeenCalledTimes(1)
    unsubscribe()
    expect(source.close).toHaveBeenCalledTimes(2)
  })

  it('전송 오류가 나면 재연결 없이 닫고 onError에 알린다', () => {
    const source = fakeSource()
    const errors: unknown[] = []
    subscribeFills({ accountId: 'a', productCode: '01', orderIds: ['O-1'] }, () => {}, undefined, (e) => { errors.push(e) }, withSource(source))
    source.listeners.get('error')!.forEach((fn) => fn({ data: '' }))
    expect(errors).toEqual([{ kind: 'transport' }])
    expect(source.close).toHaveBeenCalledTimes(1)
  })

  it('깨진 fill 메시지는 onError로 알리고 무시한다', () => {
    const source = fakeSource()
    const errors: unknown[] = []
    const seen: unknown[] = []
    subscribeFills({ accountId: 'a', productCode: '01', orderIds: ['O-1'] }, (u) => { seen.push(u) }, undefined, (e) => { errors.push(e) }, withSource(source))
    source.listeners.get('fill')!.forEach((fn) => fn({ data: 'not-json{{{' }))
    expect(errors).toEqual([{ kind: 'message', raw: 'not-json{{{' }])
    expect(seen).toEqual([])
  })

  it('unknown 체결은 onUpdate 뒤 onError unknown으로 알린다', () => {
    const source = fakeSource()
    const errors: unknown[] = []
    const seen: unknown[] = []
    const update = { orderId: 'O-1', status: 'unknown', filledQty: 0, remainingQty: 1 }
    subscribeFills({ accountId: 'a', productCode: '01', orderIds: ['O-1'] }, (u) => { seen.push(u) }, undefined, (e) => { errors.push(e) }, withSource(source))
    source.listeners.get('fill')!.forEach((fn) => fn({ data: JSON.stringify(update) }))
    expect(seen).toEqual([update])
    expect(errors).toEqual([{ kind: 'unknown', update }])
  })

  it('EventSource가 없으면 onError를 호출하고 no-op 해제 함수를 돌려준다', () => {
    const errors: unknown[] = []
    const unsubscribe = subscribeFills({ accountId: 'a', productCode: '01', orderIds: ['O-1'] }, () => { throw new Error('불려서 안 됨') }, undefined, (e) => { errors.push(e) }, null)
    expect(errors).toEqual([{ kind: 'transport' }])
    expect(unsubscribe()).toBeUndefined()
  })
})
