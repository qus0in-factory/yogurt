import { expect, it } from 'vitest'
import { formatSeoulTime } from '../../../src/app/format/date-time'

it.each([
  ['2026-10-25T14:59:00Z', '23:59'], ['2026-10-25T15:00:00Z', '00:00'],
])('서울 표시 시각 %s', (utc, expected) => {
  expect(formatSeoulTime(Date.parse(utc))).toBe(expected)
})
it('잘못된 시각의 실패를 숨기지 않는다', () => {
  expect(() => formatSeoulTime(NaN)).toThrow(RangeError)
})
