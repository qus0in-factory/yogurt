import { expect, it } from 'vitest'
import {
  formatDiffManwon, formatIsaPercent, formatNumber,
  formatPercentFixed2, formatPercentUpTo2,
} from '../../../src/app/format/numbers'

it('표시 자리수와 단위를 서로 구별한다', () => {
  expect(formatNumber(1234.5678)).toBe('1,234.568')
  expect(formatPercentFixed2(1)).toBe('1.00%')
  expect(formatPercentUpTo2(1)).toBe('1%')
  expect(formatPercentUpTo2(1.236)).toBe('1.24%')
  expect(formatIsaPercent(50)).toBe('50.0%')
  expect(formatIsaPercent(-0.0001)).toBe('0.0%')
  expect(formatIsaPercent(-1.25)).toBe('-1.3%')
})
it.each([null, NaN, Infinity, -Infinity])('ISA 비유한 입력 %s', (value) => {
  expect(formatIsaPercent(value)).toBeNull()
  expect(formatDiffManwon(value, '만', '없음')).toBe('없음')
})
it('차이 부호와 음수 0은 기존 Intl 동작을 보존한다', () => {
  expect(formatDiffManwon(15000, '만', '없음')).toBe('+2만')
  expect(formatDiffManwon(-5000, '만', '없음')).toBe('-0만')
  expect(formatDiffManwon(-10800000, '만', '없음')).toBe('-1,080만')
})
