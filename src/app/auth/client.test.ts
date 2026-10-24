import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkSession, login, logout } from './client'

describe('auth client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('세션 확인 시 200이면 true를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))
    const result = await checkSession()
    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/session')
  })

  it('세션 확인 시 401이면 false를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    const result = await checkSession()
    expect(result).toBe(false)
  })

  it('로그인 성공(204) 시 true를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    const ok = await login('test-pass')
    expect(ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test-pass' }),
    })
  })

  it('로그인 실패(401) 시 false를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    const ok = await login('wrong-pass')
    expect(ok).toBe(false)
  })

  it('로그아웃 시 /api/logout POST 요청을 보낸다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await logout()
    expect(fetch).toHaveBeenCalledWith('/api/logout', { method: 'POST' })
  })
})
