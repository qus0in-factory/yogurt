// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createKisClient } from '../../../src/infra/kis/kis-client.ts'
import { placeSingleOrder } from '../../../src/infra/kis/kis-order.ts'
import { mapKisFailure } from '../../../src/infra/kis/kis-order-check.ts'
import { createKisQueue } from '../../../src/infra/kis/kis-request-queue.ts'
import { createFakeKv } from '../fakes/kv.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const rateLimited = () => ok({ rt_cd: '1', msg_cd: 'EGW00201', msg1: '초당 거래건수를 초과하였습니다.' })

async function realClient(handler: () => Response, sleeps: number[]) {
  const cache = createFakeKv()
  await cache.put('kis-token:a', JSON.stringify({ accessToken: 'old', expiresAt: 9999 }))
  const fetchFn = vi.fn(async () => handler())
  const repository = { findCredentials: async () => ({ accountNumber: '1', productCode: '01', accessKey: 'k', secretKey: 's' }) }
  const client = createKisClient({ cache, repository: repository as never, key: 'k', fetchFn: fetchFn as typeof fetch, now: () => 1000, queue: createKisQueue({ minIntervalMs: 0 }), sleep: async (ms: number) => { sleeps.push(ms) } })
  return { account: (await client.forAccount('a'))!, fetchFn }
}

describe('KIS 초당 제한 분류', () => {
  it('EGW00201·EGW00123·초당 문구는 RATE_LIMITED다', () => {
    expect(mapKisFailure('EGW00201', '초당 거래건수를 초과하였습니다.')).toBe('RATE_LIMITED')
    expect(mapKisFailure('EGW00123', '')).toBe('RATE_LIMITED')
    expect(mapKisFailure('', '초당 거래건수 초과')).toBe('RATE_LIMITED')
    expect(mapKisFailure('APBK0000', '잔고가 부족합니다')).toBe('INSUFFICIENT_BALANCE')
  })
  it('주문 POST는 재시도 없이 확정 거부로 끝난다', async () => {
    const request = vi.fn(async () => rateLimited())
    const account = { accountNumber: '12345678', hashkey: vi.fn(async () => 'h'), request }
    const error = await placeSingleOrder({ account: account as never, productCode: '01', code: '005930', quantity: 1, side: 'buy', orderType: 'ioc' }).catch((e) => e)
    expect(error.failure).toBe('RATE_LIMITED')
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('읽기는 EGW00201에 최대 3회 시도하고 지수 백오프한다', async () => {
    const sleeps: number[] = []
    const { account, fetchFn } = await realClient(rateLimited, sleeps)
    const res = await account.request('/uapi/test', { method: 'GET', trId: 'T' })
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(sleeps).toEqual([200, 400])
    expect(((await res.json()) as { msg_cd?: string }).msg_cd).toBe('EGW00201')
  })
  it('읽기 1회 실패 뒤 성공하면 그대로 반환한다', async () => {
    let n = 0
    const sleeps: number[] = []
    const { account, fetchFn } = await realClient(() => (++n === 1 ? rateLimited() : ok({ rt_cd: '0' })), sleeps)
    const res = await account.request('/uapi/test', { method: 'GET', trId: 'T' })
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(sleeps).toEqual([200])
    expect(((await res.json()) as { rt_cd?: string }).rt_cd).toBe('0')
  })
  it('주문 POST는 EGW00201에도 재시도하지 않는다', async () => {
    const sleeps: number[] = []
    const { account, fetchFn } = await realClient(rateLimited, sleeps)
    await account.request('/uapi/domestic-stock/v1/trading/order-cash', { method: 'POST', trId: 'T', retry: false, priority: 'order', body: {} })
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(sleeps).toEqual([])
  })
  it('두 요청을 동시에 실행해도 각 요청이 자기 응답을 받는다', async () => {
    const setup = async (tag: string) => {
      const cache = createFakeKv()
      await cache.put('kis-token:a', JSON.stringify({ accessToken: 'old', expiresAt: 9999 }))
      const fetchFn = vi.fn(async () => ok({ rt_cd: '0', tag }))
      const repository = { findCredentials: async () => ({ accountNumber: '1', productCode: '01', accessKey: 'k', secretKey: 's' }) }
      const client = createKisClient({ cache, repository: repository as never, key: 'k', fetchFn: fetchFn as typeof fetch, now: () => 1000 })
      return (await client.forAccount('a'))!
    }
    const [a1, a2] = await Promise.all([setup('one'), setup('two')])
    const [r1, r2] = await Promise.all([
      a1.request('/uapi/test', { method: 'GET', trId: 'T' }).then((r) => r.json()),
      a2.request('/uapi/test', { method: 'GET', trId: 'T' }).then((r) => r.json()),
    ])
    expect((r1 as { tag?: string }).tag).toBe('one')
    expect((r2 as { tag?: string }).tag).toBe('two')
  })
})
