// @vitest-environment node
import { expect, it } from 'vitest'
import { recordIsaMonthlySnapshots } from '../../../src/infra/snapshots/isa-monthly-snapshot-recorder'
import { fakeKis, fakeKv } from './fakes'

const accounts = [{ accountId: 'isa', startDate: '2024-03-15' }]

it('만기 월 이전 날짜에는 기록하고 만기 월 1일부터는 기록하지 않는다', async () => {
  const { kv, store } = fakeKv()
  const kis = fakeKis({ isa: { total: 20 } })
  await recordIsaMonthlySnapshots(accounts, kv, kis, new Date('2027-02-28T14:59:00.000Z'))
  expect([...store.keys()]).toEqual(['isa-snapshot:isa:2027-02-28'])
  await recordIsaMonthlySnapshots(accounts, kv, kis, new Date('2027-02-28T15:00:00.000Z'))
  expect([...store.keys()]).toEqual(['isa-snapshot:isa:2027-02-28'])
  expect(kis.calls).toHaveLength(1)
})

it('만기일 당일과 만기 이후 실행에도 기록하지 않는다', async () => {
  const { kv, store } = fakeKv()
  const kis = fakeKis({ isa: { total: 20 } })
  await recordIsaMonthlySnapshots(accounts, kv, kis, new Date('2027-03-15T03:00:00.000Z'))
  await recordIsaMonthlySnapshots(accounts, kv, kis, new Date('2027-06-01T03:00:00.000Z'))
  expect(store.size).toBe(0)
  expect(kis.calls).toHaveLength(0)
})
