// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import app from '../../src/infra/worker.ts'

let sessionSecret = ''
const fakeSessions = (() => { const store = new Map<string,string>(); return { get: async (k:string) => store.get(k) ?? null, put: async (k:string,v:string) => { store.set(k,v) }, delete: async (k:string) => { store.delete(k) }, list: async () => ({ keys: [] }), getWithMetadata: async (k:string) => ({ value: store.get(k) ?? null, metadata: null }) } })() as unknown as KVNamespace
const makeEnv = (password?: string, secret?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSION_SECRET: secret, SESSIONS: fakeSessions, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env
const callLogin = (body: string, env = makeEnv('secret', sessionSecret), origin = 'https://example.com') => app.fetch(new Request(`${origin}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }), env)
const login = (password: string, env?: Env) => callLogin(JSON.stringify({ password }), env)

beforeAll(async () => { sessionSecret = await generateSessionSecret() })

describe('login', () => {
  it('올바른 비밀번호는 204와 보안 쿠키를 반환한다', async () => {
    const res = await login('secret')
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toContain('HttpOnly')
    expect(res.headers.get('set-cookie')).toContain('Secure')
    expect(res.headers.get('set-cookie')).toContain('SameSite=Strict')
  })

  it('http 로컬 개발에서는 Secure 없이 쿠키를 내려 브라우저가 저장하게 한다', async () => {
    const res = await callLogin(JSON.stringify({ password: 'secret' }), undefined, 'http://127.0.0.1:5173')
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).not.toContain('Secure')
  })

  it('틀린 비밀번호는 401이다', async () => expect((await login('wrong')).status).toBe(401))

  it.each(['{', 'null', '{}', '{"password":""}', '{"password":5}'])('잘못된 JSON 또는 스키마는 400이다', async body => {
    const res = await callLogin(body)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid request' })
  })

  it('설정 누락과 잘못된 세션 키는 503이다', async () => {
    expect((await login('secret', makeEnv('secret', undefined))).status).toBe(503)
    expect((await login('secret', makeEnv(undefined, sessionSecret))).status).toBe(503)
    expect((await login('secret', makeEnv('secret', 'invalid'))).status).toBe(503)
    expect((await login('secret', { ENVIRONMENT: 'test', LOGIN_PASSWORD: 'secret', SESSION_SECRET: sessionSecret, ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env)).status).toBe(503)
  })
})
