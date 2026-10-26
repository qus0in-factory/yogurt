import { expect, it } from 'vitest'
import { isSeoulMinuteShape, seoulDate, seoulDateTime } from '../../../src/domain/shared/seoul-time'

it.each([
  ['2026-12-31T14:59:59Z', '2026-12-31', '2026-12-31 23:59'],
  ['2026-12-31T15:00:00Z', '2027-01-01', '2027-01-01 00:00'],
])('서울 연 경계 %s', (utc, date, time) => {
  expect(seoulDate(new Date(utc))).toBe(date)
  expect(seoulDateTime(new Date(utc))).toBe(time)
})
it('잘못된 Date의 기존 RangeError를 유지한다', () => {
  expect(() => seoulDate(new Date(NaN))).toThrow(RangeError)
  expect(() => seoulDateTime(new Date(NaN))).toThrow(RangeError)
})
it('저장 시각 모양은 달력의 실존 검증과 구별한다', () => {
  expect(isSeoulMinuteShape('2026-02-30 10:00')).toBe(true)
  expect(isSeoulMinuteShape('2026/10/25 10:00')).toBe(false)
  expect(isSeoulMinuteShape('2026-10-25 10:00:00')).toBe(false)
})
