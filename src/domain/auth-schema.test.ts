import { describe, expect, it } from 'vitest'
import { loginRequestSchema, sessionResponseSchema } from './auth-schema'

describe('auth schemas', () => {
  it('로그인 요청은 비어 있지 않은 password만 허용한다', () => {
    expect(loginRequestSchema.safeParse({ password: 'secret' }).success).toBe(true)
    expect(loginRequestSchema.safeParse({ password: '' }).success).toBe(false)
    expect(loginRequestSchema.safeParse({ password: 1 }).success).toBe(false)
  })

  it('세션 응답은 boolean authenticated를 요구한다', () => {
    expect(sessionResponseSchema.parse({ authenticated: true })).toEqual({ authenticated: true })
    expect(sessionResponseSchema.safeParse({ authenticated: 'true' }).success).toBe(false)
  })
})
