// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { createKisClient } from '../../../src/infra/kis/kis-client.ts'
import { createKisQueue } from '../../../src/infra/kis/kis-request-queue.ts'
import { createFakeKv } from '../fakes/kv.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const rate = () => ok({ rt_cd: '1', msg_cd: 'EGW00215', msg1: '원장에서 허용 가능한 초당 거래건수를 초과하였습니다.' })

async function accountWith(handler: () => Response, sleeps: number[]) {
  const cache = createFakeKv()
  await cache.put('kis-token:a', JSON.stringify({ accessToken: 'old', expiresAt: 9999 }))
  const fetchFn = vi.fn(async () => handler())
  const repository = { findCredentials: async () => ({ accountNumber: '1', productCode: '01', accessKey: 'k', secretKey: 's' }) }
  const client = createKisClient({ cache, repository: repository as never, key: 'k', fetchFn: fetchFn as typeof fetch, now: () => 1000, queue: createKisQueue({ minIntervalMs: 0 }), sleep: async (ms: number) => { sleeps.push(ms) } })
  return { account: (await client.forAccount('a'))!, fetchFn }
}

it('EGW00215 읽기는 백오프 뒤 재시도해 성공한다', async () => {
  let call = 0
  const sleeps: number[] = []
  const { account, fetchFn } = await accountWith(() => (++call === 1 ? rate() : ok({ rt_cd: '0' })), sleeps)
  const response = await account.request('/uapi/test', { method: 'GET', trId: 'T' })
  expect(fetchFn).toHaveBeenCalledTimes(2)
  expect(sleeps).toEqual([200])
  expect(((await response.json()) as { rt_cd?: string }).rt_cd).toBe('0')
})

it('EGW00215 주문 POST는 1회만 나간다', async () => {
  const sleeps: number[] = []
  const { account, fetchFn } = await accountWith(rate, sleeps)
  await account.request('/uapi/domestic-stock/v1/trading/order-cash', { method: 'POST', trId: 'T', retry: false, priority: 'order', body: {} })
  expect(fetchFn).toHaveBeenCalledTimes(1)
  expect(sleeps).toEqual([])
})
