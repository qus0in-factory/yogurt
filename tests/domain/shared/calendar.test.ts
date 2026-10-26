import { expect, it } from 'vitest'
import { isIsoDate, monthKey } from '../../../src/domain/shared/calendar'

it.each([
  ['2024-02-29', true], ['2025-02-29', false], ['2024-02-30', false],
  ['2026-1-01', false], ['', false], ['2026-13-01', false], ['2026-04-31', false],
])('ISO 날짜 %s → %s', (value, valid) => expect(isIsoDate(value)).toBe(valid))
it('월 키는 날짜 검증을 대신하지 않는 추출이다', () => {
  expect(monthKey('2026-10-25')).toBe('2026-10')
  expect(monthKey('2026-10')).toBe('2026-10')
})
