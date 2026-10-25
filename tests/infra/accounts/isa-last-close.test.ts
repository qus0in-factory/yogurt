// @vitest-environment node
import { expect, it } from 'vitest'
import { findIsaLastClose } from '../../../src/infra/accounts/isa-last-close'
import { createFakeKv } from '../fakes/kv'

const now = new Date('2026-10-15T03:00:00.000Z')
const key = (date: string) => `isa-snapshot:acct:${date}`
const seed = async (kv: KVNamespace, date: string, value: unknown) => {
  await kv.put(key(date), typeof value === 'string' ? value : JSON.stringify(value))
}

it('직전 월 마지막 날 기록이 있으면 그 값과 날짜를 돌려준다', async () => {
  const kv = createFakeKv()
  await seed(kv, '2026-09-30', { totalAssetsWon: 1000, recordedAt: '2026-09-30T06:40:00.000Z' })
  expect(await findIsaLastClose(kv, 'acct', now)).toEqual({ date: '2026-09-30', totalAssetsWon: 1000 })
})

it('마지막 날에 없으면 하루씩 앞으로 최대 7일까지 찾는다', async () => {
  const kv = createFakeKv()
  await seed(kv, '2026-09-27', { totalAssetsWon: 300, recordedAt: '' })
  await seed(kv, '2026-09-23', { totalAssetsWon: 700, recordedAt: '' })
  expect(await findIsaLastClose(kv, 'acct', now)).toEqual({ date: '2026-09-27', totalAssetsWon: 300 })
})

it('7일 안에 기록이 없으면 null이다', async () => {
  const kv = createFakeKv()
  await seed(kv, '2026-09-22', { totalAssetsWon: 800, recordedAt: '' })
  expect(await findIsaLastClose(kv, 'acct', now)).toBeNull()
})

it('깨진 값·음수·비정수는 기록 없음으로 보고 더 과거를 찾는다', async () => {
  const kv = createFakeKv()
  await seed(kv, '2026-09-30', 'not json')
  await seed(kv, '2026-09-29', { totalAssetsWon: -1, recordedAt: '' })
  await seed(kv, '2026-09-28', { totalAssetsWon: 1.5, recordedAt: '' })
  await seed(kv, '2026-09-27', { totalAssetsWon: 270, recordedAt: '' })
  expect(await findIsaLastClose(kv, 'acct', now)).toEqual({ date: '2026-09-27', totalAssetsWon: 270 })
})

it('키가 없으면 null이다(ISA가 아닌 계좌 포함)', async () => {
  expect(await findIsaLastClose(createFakeKv(), 'irp', now)).toBeNull()
})
