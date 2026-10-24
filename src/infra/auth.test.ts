// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { timingSafeEqualStrings } from './auth'

describe('auth helpers', () => {
  it('상수 시간 비교가 동일 문자열에 true를 반환한다', () => {
    expect(timingSafeEqualStrings('secret', 'secret')).toBe(true)
  })

  it('상수 시간 비교가 다른 문자열에 false를 반환한다', () => {
    expect(timingSafeEqualStrings('secret', 'wrong')).toBe(false)
  })
})
