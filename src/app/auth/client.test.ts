import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTPError } from 'ky'
import { checkSession, login, logout } from './client'

const request = () => vi.mocked(fetch).mock.calls[0]?.[0] as Request
const path = () => new URL(request().url).pathname

describe('auth client', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('200 세션 응답의 authenticated 값을 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"authenticated":false}', { status: 200 }))
    expect(await checkSession()).toBe(false)
    expect(path()).toBe('/api/session')
  })

  it('401 세션 응답은 false, 다른 HTTP 오류는 throw한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }))
    expect(await checkSession()).toBe(false)
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 403 }))
    await expect(checkSession()).rejects.toBeInstanceOf(HTTPError)
  })

  it('잘못된 200 세션 본문은 throw한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"authenticated":"yes"}', { status: 200 }))
    await expect(checkSession()).rejects.toThrow()
  })

  it('204 로그인은 true이고 요청은 JSON POST다', async () => {
    let body: unknown
    vi.mocked(fetch).mockImplementationOnce(async (input) => {
      body = await (input as Request).clone().json()
      return new Response(null, { status: 204 })
    })
    expect(await login('secret')).toBe(true)
    expect(path()).toBe('/api/login')
    expect(request().method).toBe('POST')
    expect(body).toEqual({ password: 'secret' })
  })

  it('401 로그인은 false, 다른 응답과 HTTP 오류는 throw한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 }))
    expect(await login('wrong')).toBe(false)
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 403 }))
    await expect(login('wrong')).rejects.toBeInstanceOf(HTTPError)
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 200 }))
    await expect(login('secret')).rejects.toThrow('Unexpected login response')
  })

  it('logout은 /api/logout에 POST한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(logout()).resolves.toBeUndefined()
    expect(path()).toBe('/api/logout')
    expect(request().method).toBe('POST')
  })
})
