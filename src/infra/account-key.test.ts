// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generateAccountKey } from './account-key.ts'

describe('account key', () => {
  it('base64 디코딩하면 정확히 32바이트다', () => {
    const bytes = atob(generateAccountKey())
    expect(bytes.length).toBe(32)
  })

  it('두 번 호출하면 값이 다르다', () => {
    expect(generateAccountKey()).not.toEqual(generateAccountKey())
  })
})
