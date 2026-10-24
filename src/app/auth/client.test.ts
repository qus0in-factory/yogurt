import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { HTTPError } from 'ky'
import { checkSession, login, logout } from './client'

const origin = window.location.origin
const sessionUrl = `${origin}/api/session`
const loginUrl = `${origin}/api/login`
const logoutUrl = `${origin}/api/logout`
let lastRequest: { url: string; method: string }
let body: unknown
const response = (status: number, data?: unknown) => data === undefined
  ? new HttpResponse(null, { status })
  : HttpResponse.json(data, { status })
const get = (url: string, status: number, data?: unknown) => http.get(url, ({ request }) => {
  lastRequest = request
  return response(status, data)
})
const post = (url: string, status: number) => http.post(url, async ({ request }) => {
  lastRequest = request
  body = await request.clone().json().catch(() => undefined)
  return response(status)
})
const server = setupServer(
  get(sessionUrl, 200, { authenticated: true }),
  post(loginUrl, 204),
  post(logoutUrl, 204),
)
const path = () => new URL(lastRequest.url).pathname

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('auth client', () => {
  it('200 세션 응답의 authenticated 값을 반환한다', async () => {
    server.use(get(sessionUrl, 200, { authenticated: false }))
    expect(await checkSession()).toBe(false)
    expect(path()).toBe('/api/session')
    expect(lastRequest.url).toBe(`${window.location.origin}/api/session`)
  })

  it('401 세션 응답은 false, 다른 HTTP 오류는 throw한다', async () => {
    server.use(get(sessionUrl, 401))
    expect(await checkSession()).toBe(false)
    server.use(get(sessionUrl, 403))
    await expect(checkSession()).rejects.toBeInstanceOf(HTTPError)
  })

  it('잘못된 200 세션 본문은 throw한다', async () => {
    server.use(get(sessionUrl, 200, { authenticated: 'yes' }))
    await expect(checkSession()).rejects.toThrow()
  })

  it('204 로그인은 true이고 요청은 JSON POST다', async () => {
    expect(await login('secret')).toBe(true)
    expect(path()).toBe('/api/login')
    expect(lastRequest.method).toBe('POST')
    expect(body).toEqual({ password: 'secret' })
  })

  it('401 로그인은 false, 다른 응답과 HTTP 오류는 throw한다', async () => {
    server.use(post(loginUrl, 401))
    expect(await login('wrong')).toBe(false)
    server.use(post(loginUrl, 403))
    await expect(login('wrong')).rejects.toBeInstanceOf(HTTPError)
    server.use(post(loginUrl, 200))
    await expect(login('secret')).rejects.toThrow('Unexpected login response')
  })

  it('logout은 /api/logout에 POST한다', async () => {
    await expect(logout()).resolves.toBeUndefined()
    expect(path()).toBe('/api/logout')
    expect(lastRequest.method).toBe('POST')
  })
})
