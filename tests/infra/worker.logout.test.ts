// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import app from '../../src/infra/worker.ts'

let sessionSecret = ''
const fakeSessions = (() => { const store = new Map<string,string>(); return { get: async (k:string) => store.get(k) ?? null, put: async (k:string,v:string) => { store.set(k,v) }, delete: async (k:string) => { store.delete(k) }, list: async () => ({ keys: [] }), getWithMetadata: async (k:string) => ({ value: store.get(k) ?? null, metadata: null }) } })() as unknown as KVNamespace
const makeEnv = (password?: string, secret?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSION_SECRET: secret, SESSIONS: fakeSessions, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env

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
