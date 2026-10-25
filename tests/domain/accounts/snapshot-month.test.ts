import { expect, it } from 'vitest'
import {
  daysBefore, isaExpiryMonth, previousMonthEnd, seoulYearMonth, shouldRecordSnapshotMonth,
} from '../../../src/domain/accounts/snapshot-month'

it('서울 시간 자정 경계에서 연월이 바뀐다', () => {
  expect(seoulYearMonth(new Date('2026-01-31T14:59:59.000Z'))).toBe('2026-01')
  expect(seoulYearMonth(new Date('2026-01-31T15:00:00.000Z'))).toBe('2026-02')
  expect(seoulYearMonth(new Date('2026-12-31T15:00:00.000Z'))).toBe('2027-01')
})

it('만기 월 직전 달까지 기록하고 만기 월과 그 이후는 기록하지 않는다', () => {
  expect(isaExpiryMonth('2024-03-15')).toBe('2027-03')
  expect(shouldRecordSnapshotMonth('2027-02', '2024-03-15')).toBe(true)
  expect(shouldRecordSnapshotMonth('2027-03', '2024-03-15')).toBe(false)
  expect(shouldRecordSnapshotMonth('2027-06', '2024-03-15')).toBe(false)
})

it('윤일 시작도 달력 기준 만기 월을 쓴다', () => {
  expect(isaExpiryMonth('2024-02-29')).toBe('2027-02')
  expect(shouldRecordSnapshotMonth('2027-02', '2024-02-29')).toBe(false)
})

it('시작일이 없으면 기존처럼 기록한다', () => {
  expect(isaExpiryMonth(null)).toBeNull()
  expect(shouldRecordSnapshotMonth('2027-03', null)).toBe(true)
})

it('서울 월 경계에서 직전 월 마지막 날을 계산한다', () => {
  expect(previousMonthEnd(new Date('2025-12-31T14:59:00.000Z'))).toBe('2025-11-30')
  expect(previousMonthEnd(new Date('2025-12-31T15:00:00.000Z'))).toBe('2025-12-31')
  expect(previousMonthEnd(new Date('2028-03-15T00:00:00.000Z'))).toBe('2028-02-29')
  expect(daysBefore('2026-01-01', 1)).toBe('2025-12-31')
})
