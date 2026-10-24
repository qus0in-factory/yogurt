import { beforeEach, describe, expect, it } from 'vitest'
import { readSessionJson, removeSession, writeSessionJson } from '../../../src/ui/lib/session-draft'

const KEY = 'yogurt:test'

describe('session-draft', () => {
  beforeEach(() => sessionStorage.clear())

  it('writeSessionJson으로 넣으면 readSessionJson으로 동일한 값을 읽는다', () => {
    writeSessionJson(KEY, { alias: '주계좌', accountNumber: '1' })
    expect(readSessionJson(KEY)).toEqual({ alias: '주계좌', accountNumber: '1' })
  })

  it('값이 없으면 readSessionJson은 null을 반환한다', () => {
    expect(readSessionJson(KEY)).toBeNull()
  })

  it('JSON 파싱 실패 시 null을 반환한다', () => {
    sessionStorage.setItem(KEY, '{broken')
    expect(readSessionJson(KEY)).toBeNull()
  })

  it('removeSession으로 키를 제거한다', () => {
    writeSessionJson(KEY, { a: 1 })
    removeSession(KEY)
    expect(readSessionJson(KEY)).toBeNull()
  })
})
