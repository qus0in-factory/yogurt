import { describe, expect, it } from 'vitest'
import { DEFAULT_PAGE, isPageId, normalizePage } from '../../../src/domain/navigation/page'

describe('page domain', () => {
  it('기본 페이지는 accounts다', () => {
    expect(DEFAULT_PAGE).toBe('accounts')
  })

  it('유효한 페이지 식별자를 유지한다', () => {
    expect(normalizePage('overview')).toBe('overview')
    expect(normalizePage('accounts')).toBe('accounts')
    expect(isPageId('overview')).toBe(true)
    expect(isPageId('accounts')).toBe(true)
  })

  it.each([
    ['unknown', 'unknown'],
    ['대문자', 'OVERVIEW'],
    ['공백 포함', ' accounts '],
    ['null', null],
    ['undefined', undefined],
    ['숫자', 123],
    ['객체', { screen: 'overview' }],
    ['배열', ['overview']],
  ])('잘못된 값(%s)은 기본 페이지 accounts로 대체한다', (_, input) => {
    expect(normalizePage(input)).toBe('accounts')
    expect(isPageId(input)).toBe(false)
  })
})
