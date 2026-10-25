// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { KisApiError } from '../../../src/infra/kis/kis-stock-balance'
import { recordIsaMonthlySnapshots } from '../../../src/infra/snapshots/isa-monthly-snapshot-recorder'
import { fakeKis, fakeKv, summary } from './fakes'

const date = new Date('2026-10-25T03:00:00.000Z')

it('한 계좌가 실패해도 나머지를 기록하고 민감 정보 없는 로그만 남긴다', async () => {
  const accounts = [{ accountId: 'bad-account', startDate: null }, { accountId: 'good', startDate: null }]
  const kis = fakeKis({ 'bad-account': new KisApiError('EGW00123', 'secret'), good: { total: 987654 } })
  const { kv, store } = fakeKv()
  const log = vi.fn()
  await recordIsaMonthlySnapshots(accounts, kv, kis, date, log)
  expect([...store.keys()]).toEqual(['isa-snapshot:good:2026-10-25'])
  expect(log).toHaveBeenCalledExactlyOnceWith('계좌 기록 실패', 502)
  const text = JSON.stringify(log.mock.calls)
  for (const secret of ['bad-account', '12345678', 'AK', 'SK', 'secret', '987654']) expect(text).not.toContain(secret)
})

it('총자산이 0 미만이거나 없으면 기록하지 않고 고정 문구만 남긴다', async () => {
  const accounts = [{ accountId: 'negative', startDate: null }, { accountId: 'missing', startDate: null }]
  const kis = fakeKis({ negative: { total: -1 }, missing: { rows: [1] } })
  const { kv, store } = fakeKv()
  const log = vi.fn()
  await recordIsaMonthlySnapshots(accounts, kv, kis, date, log)
  expect(store.size).toBe(0)
  expect(log.mock.calls).toEqual([['계좌 기록 실패', 500], ['계좌 기록 실패', 500]])
  for (const secret of ['negative', 'missing', '12345678']) expect(JSON.stringify(log.mock.calls)).not.toContain(secret)
})

it('총자산이 정수가 아니면 기록하지 않고 고정 문구만 남긴다', async () => {
  const accounts = [{ accountId: 'decimal', startDate: null }, { accountId: 'text', startDate: null }]
  const kis = { async forAccount(id: string) {
    const total = id === 'decimal' ? '1.5' : 'abc'
    return { accountNumber: '12345678', request: async () => Response.json({ rt_cd: '0', output1: [], output2: { ...summary(0), tot_asst_amt: total } }) }
  } }
  const { kv, store } = fakeKv()
  const log = vi.fn()
  await recordIsaMonthlySnapshots(accounts, kv, kis, date, log)
  expect(store.size).toBe(0)
  expect(log.mock.calls).toEqual([['계좌 기록 실패', 500], ['계좌 기록 실패', 500]])
})
