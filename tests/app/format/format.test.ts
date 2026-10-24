import { describe, expect, it } from 'vitest'
import { formatDate, formatKRW } from '../../../src/app/format/format'

describe('formatKRW', () => {
  it('원화 금액을 천 단위 구분과 ₩ 기호로 표시한다', () => {
    expect(formatKRW(1234567)).toBe('₩1,234,567')
  })

  it('0원을 ₩0으로 표시한다', () => {
    expect(formatKRW(0)).toBe('₩0')
  })

  it('음수 금액은 부호를 앞에 붙여 표시한다', () => {
    expect(formatKRW(-50000)).toBe('-₩50,000')
  })
})

describe('formatDate', () => {
  it('ISO 날짜 문자열을 YYYY.MM.DD 형식으로 표시한다', () => {
    expect(formatDate('2026-10-24')).toBe('2026.10.24')
  })

  it('시각이 포함된 ISO 문자열도 날짜 부분만 표시한다', () => {
    expect(formatDate('2026-03-05T09:30:00Z')).toBe('2026.03.05')
  })

  it('UTC 자정 경계를 서울 달력 일자로 변환한다', () => {
    expect(formatDate('2026-01-04T15:30:00Z')).toBe('2026.01.05')
  })

  it('오프셋이 포함된 문자열도 서울 달력 일자로 변환한다', () => {
    expect(formatDate('2026-01-05T09:00:00+09:00')).toBe('2026.01.05')
  })

  it('잘못된 입력은 빈 문자열을 반환한다', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})
