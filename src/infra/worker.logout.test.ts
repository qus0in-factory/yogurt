// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { generateSessionSecret } from './session-key.ts'
import app from './worker.ts'

let sessionSecret = ''
const makeEnv = (password?: string, secret?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSION_SECRET: secret, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env

beforeAll(async () => {
  sessionSecret = await generateSessionSecret()
})

describe('logout', () => {
  it('204와 쿠키 삭제를 반환한다', async () => {
    const login = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      }),
      makeEnv('secret', sessionSecret),
    )
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
    const res = await app.fetch(new Request('https://example.com/api/logout', { method: 'POST', headers: { Cookie: cookie } }), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(204)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/Max-Age=0/i)
  })

  it('유효하지 않은 세션에서도 204와 쿠키 삭제를 반환한다', async () => {
    const res = await app.fetch(new Request('https://example.com/api/logout', { method: 'POST', headers: { Cookie: 'session=bad.token' } }), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(204)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/Max-Age=0/i)
  })
})
