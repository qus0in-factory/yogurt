import { expect, it } from 'vitest'
import {
  daysBefore, isaExpiryMonth, previousMonthEnd, seoulDate, seoulDateTime,
  seoulYearMonth, shouldRecordSnapshotMonth,
} from '../../../src/domain/accounts/snapshot-month'

it.each([
  ['2026-12-31T14:59:59.999Z', '2026-12-31', '2026-12-31 23:59', '2026-11-30'],
  ['2026-12-31T15:00:00.000Z', '2027-01-01', '2027-01-01 00:00', '2026-12-31'],
  ['2024-02-29T15:00:00.000Z', '2024-03-01', '2024-03-01 00:00', '2024-02-29'],
])('서울 날짜/시각/직전 월말 경계 %s', (utc, date, time, end) => {
  const now = new Date(utc)
  expect(seoulDate(now)).toBe(date)
  expect(seoulDateTime(now)).toBe(time)
  expect(seoulYearMonth(now)).toBe(date.slice(0, 7))
  expect(previousMonthEnd(now)).toBe(end)
})

it.each(['', 'invalid', '2024/03/15'])('형식이 없는 시작일 %s는 만기 제한을 만들지 않는다', (start) => {
  expect(isaExpiryMonth(start)).toBeNull()
  expect(shouldRecordSnapshotMonth('2027-03', start)).toBe(true)
})

it('12월 만기는 연도 넘어가는 다음 달도 제외한다', () => {
  expect(isaExpiryMonth('2023-12-31')).toBe('2026-12')
  expect(shouldRecordSnapshotMonth('2026-11', '2023-12-31')).toBe(true)
  expect(shouldRecordSnapshotMonth('2026-12', '2023-12-31')).toBe(false)
  expect(shouldRecordSnapshotMonth('2027-01', '2023-12-31')).toBe(false)
})

it('일수 0은 그대로이고 윤년 월 경계를 넘어 뺀다', () => {
  expect(daysBefore('2024-03-01', 0)).toBe('2024-03-01')
  expect(daysBefore('2024-03-01', 1)).toBe('2024-02-29')
  expect(daysBefore('2025-03-01', 1)).toBe('2025-02-28')
})
