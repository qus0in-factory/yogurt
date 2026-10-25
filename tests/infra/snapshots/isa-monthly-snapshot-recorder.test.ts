// @vitest-environment node
import { expect, it } from 'vitest'
import { recordIsaMonthlySnapshots } from '../../../src/infra/snapshots/isa-monthly-snapshot-recorder'
import { fakeKis, fakeKv, summary } from './fakes'

const accounts = [{ accountId: 'a1', startDate: null }]
const date = new Date('2026-10-25T03:00:00.000Z')
const key = 'isa-snapshot:a1:2026-10-25'

it('서울 날짜 키로 JSON과 180일 TTL을 저장한다', async () => {
  const { kv, store, puts } = fakeKv()
  await recordIsaMonthlySnapshots(accounts, kv, fakeKis({ a1: { total: 300 } }), date)
  expect([...store.keys()]).toEqual([key])
  expect(JSON.parse(store.get(key) as string)).toEqual({ totalAssetsWon: 300, recordedAt: date.toISOString() })
  expect(puts).toEqual([{ key, expirationTtl: 15552000 }])
})

it('서울 자정 경계에서 날짜 키가 바뀐다', async () => {
  const { kv, store } = fakeKv()
  const kis = fakeKis({ a1: { total: 1 } })
  await recordIsaMonthlySnapshots(accounts, kv, kis, new Date('2026-10-24T14:59:59.000Z'))
  await recordIsaMonthlySnapshots(accounts, kv, kis, new Date('2026-10-24T15:00:00.000Z'))
  expect([...store.keys()]).toEqual(['isa-snapshot:a1:2026-10-24', 'isa-snapshot:a1:2026-10-25'])
})

it('같은 날짜에 두 번 기록하면 최신 값으로 덮어쓴다', async () => {
  const { kv, store } = fakeKv()
  let assets = { total: 300 }
  const kis = { async forAccount() {
    return { accountNumber: '12345678', request: async () => Response.json({ rt_cd: '0', output1: [], output2: summary(assets.total) }) }
  } }
  await recordIsaMonthlySnapshots(accounts, kv, kis, date)
  assets = { total: 400 }
  await recordIsaMonthlySnapshots(accounts, kv, kis, date)
  expect([...store.keys()]).toEqual([key])
  expect(JSON.parse(store.get(key) as string).totalAssetsWon).toBe(400)
})

it('보유 행이 비어 있어도 summary.totalAssets가 있으면 기록한다', async () => {
  const { kv, store } = fakeKv()
  await recordIsaMonthlySnapshots(accounts, kv, fakeKis({ a1: { total: 500 } }), date)
  expect([...store.keys()]).toEqual([key])
  expect(JSON.parse(store.get(key) as string).totalAssetsWon).toBe(500)
})

it('마지막 보유 행 값이 아니라 summary.totalAssets를 저장한다', async () => {
  const { kv, store } = fakeKv()
  await recordIsaMonthlySnapshots(accounts, kv, fakeKis({ a1: { rows: [10, 999], total: 300 } }), date)
  expect(JSON.parse(store.get(key) as string).totalAssetsWon).toBe(300)
})
