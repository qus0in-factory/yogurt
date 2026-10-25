import { afterEach, describe, expect, it } from 'vitest'
import {
  LAST_PAGE_STORAGE_KEY,
  readLastPage,
} from '../../../src/infra/navigation/last-page-storage'

describe('last-page-storage invalid & edge cases', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it.each([
    ['빈 문자열', ''],
    ['깨진 JSON', '{"version": 1,'],
    ['배열', '["overview"]'],
    ['null 원시값', 'null'],
    ['숫자 원시값', '123'],
    ['문자열 원시값', '"overview"'],
    ['boolean 원시값', 'true'],
    ['screen 누락', JSON.stringify({ version: 1 })],
    ['screen 숫자 타입 오류', JSON.stringify({ version: 1, screen: 123 })],
    ['screen null 타입 오류', JSON.stringify({ version: 1, screen: null })],
    ['미허용 screen 값', JSON.stringify({ version: 1, screen: 'admin' })],
    ['대문자 screen 값', JSON.stringify({ version: 1, screen: 'OVERVIEW' })],
    ['미지원 버전(0)', JSON.stringify({ version: 0, screen: 'overview' })],
    ['미지원 버전(2)', JSON.stringify({ version: 2, screen: 'overview' })],
    ['버전 누락', JSON.stringify({ screen: 'overview' })],
    ['버전 문자열', JSON.stringify({ version: '1', screen: 'overview' })],
  ])('잘못된 저장 형태(%s)는 기본값 accounts를 반환한다', (_, raw) => {
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, raw)
    expect(readLastPage()).toBe('accounts')
  })

  it('추가 필드가 포함된 페이로드에서도 오직 유효한 screen만 복원한다', () => {
    localStorage.setItem(
      LAST_PAGE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        screen: 'overview',
        token: 'secret-token',
        accountNumber: '123-45',
      }),
    )
    expect(readLastPage()).toBe('overview')
  })
})
