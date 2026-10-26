import { describe, expect, it } from 'vitest'
import { formatBps, parsePercentToBps } from '../../../src/domain/portfolio/weight'

describe('percent to bps', () => {
  it.each([
    ['0.01', 1],
    ['1', 100],
    ['60', 6000],
    ['60.5', 6050],
    ['99.99', 9999],
    ['100', 10000],
    [' 12.34 ', 1234],
  ])('%s는 %i bp로 변환된다', (input, expected) => {
    expect(parsePercentToBps(input)).toBe(expected)
  })

  it.each(['0', '0.00', '100.01', '-1', '', '  ', '12.345', '1e2', 'NaN', 'Infinity', '12.', '.5', 'abc'])(
    '잘못된 입력(%s)은 null이다', (input) => {
      expect(parsePercentToBps(input)).toBeNull()
    })
})

describe('bps to percent', () => {
  it('소수 둘째 자리 문자열로 표시한다', () => {
    expect(formatBps(1)).toBe('0.01%')
    expect(formatBps(6050)).toBe('60.50%')
    expect(formatBps(10000)).toBe('100.00%')
  })
})
