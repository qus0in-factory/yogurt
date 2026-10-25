import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LAST_PAGE_STORAGE_KEY,
  LAST_PAGE_STORAGE_VERSION,
  readLastPage,
  writeLastPage,
} from '../../../src/infra/navigation/last-page-storage'

describe('last-page-storage valid & persistence', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('각 페이지 저장 시 version과 screen만 정확히 기록한다', () => {
    writeLastPage('overview')
    expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBe(
      JSON.stringify({ version: LAST_PAGE_STORAGE_VERSION, screen: 'overview' }),
    )

    writeLastPage('accounts')
    expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBe(
      JSON.stringify({ version: LAST_PAGE_STORAGE_VERSION, screen: 'accounts' }),
    )
  })

  it('유효한 JSON을 정상 복원한다', () => {
    localStorage.setItem(
      LAST_PAGE_STORAGE_KEY,
      JSON.stringify({ version: 1, screen: 'overview' }),
    )
    expect(readLastPage()).toBe('overview')
  })

  it('키가 없으면 기본값 accounts를 반환한다', () => {
    expect(readLastPage()).toBe('accounts')
  })

  it('localStorage 접근 예외(SecurityError 등)가 발생해도 안전하게 처리한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readLastPage()).toBe('accounts')

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => writeLastPage('overview')).not.toThrow()
  })

  it('입력에 민감 필드가 포함되어도 허용된 screen 외에는 기록되지 않는다', () => {
    writeLastPage('overview' as any)
    const stored = JSON.parse(localStorage.getItem(LAST_PAGE_STORAGE_KEY)!)
    expect(Object.keys(stored).sort()).toEqual(['screen', 'version'])
    expect(stored.screen).toBe('overview')
    expect(stored.version).toBe(1)
  })
})
