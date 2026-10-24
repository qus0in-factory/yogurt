// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { PublicProtocol } from 'paseto'
import { GetPublicKeyFactory, ImportSecretKeyFactory, SignFactory, VerifyFactory } from 'paseto/v4/public'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import app from '../../src/infra/worker.ts'
import { createFakeKv } from './fakes/kv.ts'

let sessionSecret = ''
const fakeSessions = createFakeKv()
const v4 = new PublicProtocol(GetPublicKeyFactory, ImportSecretKeyFactory, SignFactory, VerifyFactory)
const makeEnv = (password?: string, secret?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSION_SECRET: secret, SESSIONS: fakeSessions, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env

beforeAll(async () => {
  sessionSecret = await generateSessionSecret()
})

describe('session', () => {
  it('쿠키 없이는 401이다', async () => {
    const res = await app.fetch(new Request('https://example.com/api/session'), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(401)
  })

  it('유효한 쿠키는 200이다', async () => {
    const login = await app.fetch(
      new Request('https://example.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      }),
      makeEnv('secret', sessionSecret),
    )
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
    const res = await app.fetch(new Request('https://example.com/api/session', { headers: { Cookie: cookie } }), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ authenticated: true })
  })

  it('만료된 토큰은 401이다', async () => {
    const secretKey = await v4.ImportSecretKey(sessionSecret as `k4.secret.${string}`)
    const token = await v4.Sign(secretKey, { exp: new Date(Date.now() - 10_000).toISOString() })
    const res = await app.fetch(new Request('https://example.com/api/session', { headers: { Cookie: `session=${token}` } }), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(401)
  })

  it('변조된 토큰은 401이다', async () => {
    const res = await app.fetch(new Request('https://example.com/api/session', { headers: { Cookie: 'session=bad.token' } }), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(401)
  })

  it('다른 키로 서명된 토큰은 401이다', async () => {
    const other = await generateSessionSecret()
    const token = await createSessionToken(other)
    const res = await app.fetch(new Request('https://example.com/api/session', { headers: { Cookie: `session=${token}` } }), makeEnv('secret', sessionSecret))
    expect(res.status).toBe(401)
  })
})

describe('session kv invalidation', () => {
  it('KV에 없는 서명 유효 토큰은 401이다', async () => {
    const token = await createSessionToken(sessionSecret)
    const emptySessions = createFakeKv()
    const res = await app.fetch(new Request('https://example.com/api/session', { headers: { Cookie: `session=${token}` } }), { ENVIRONMENT: 'test', LOGIN_PASSWORD: 'secret', SESSION_SECRET: sessionSecret, SESSIONS: emptySessions, ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env)
    expect(res.status).toBe(401)
  })

  it('로그아웃 후 같은 쿠키로 session과 accounts는 401이다', async () => {
    const login = await app.fetch(new Request('https://example.com/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'secret' }) }), makeEnv('secret', sessionSecret))
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]
    const logout = await app.fetch(new Request('https://example.com/api/logout', { method: 'POST', headers: { Cookie: cookie } }), makeEnv('secret', sessionSecret))
    expect(logout.status).toBe(204)
    const sessionRes = await app.fetch(new Request('https://example.com/api/session', { headers: { Cookie: cookie } }), makeEnv('secret', sessionSecret))
    const accountsRes = await app.fetch(new Request('https://example.com/api/accounts', { headers: { Cookie: cookie } }), makeEnv('secret', sessionSecret))
    expect(sessionRes.status).toBe(401)
    expect(accountsRes.status).toBe(401)
  })
})
