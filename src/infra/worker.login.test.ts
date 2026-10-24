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

describe('login', () => {
  it('올바른 비밀번호는 204와 Set-Cookie를 반환한다', async () => {
    const res = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      }),
      makeEnv('secret', sessionSecret),
    )
    expect(res.status).toBe(204)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Strict')
  })

  it('틀린 비밀번호는 401이다', async () => {
    const res = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong' }),
      }),
      makeEnv('secret', sessionSecret),
    )
    expect(res.status).toBe(401)
  })

  it('secret 미설정은 503으로 거부한다', async () => {
    const res = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      }),
      makeEnv('secret', undefined),
    )
    expect(res.status).toBe(503)
  })

  it('로그인 비밀번호 미설정도 503으로 거부한다', async () => {
    const res = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      }),
      makeEnv(undefined, sessionSecret),
    )
    expect(res.status).toBe(503)
  })

  it('SESSION_SECRET 형식 오류는 503으로 거부한다', async () => {
    const res = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      }),
      makeEnv('secret', 'not-a-paserk'),
    )
    expect(res.status).toBe(503)
  })
})
