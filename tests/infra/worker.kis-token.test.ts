// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { encryptText } from '../../src/infra/accounts/account-crypto.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import { createFakeKv } from './fakes/kv.ts'
import type { Context } from 'hono'
const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))
let sessionSecret = ''
let token = ''
const accountId = 'acc-1'
const makeEnv = (DB?: D1Database, cache?: KVNamespace) => ({
  ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: createFakeKv(),
  DB, ACCOUNT_ENCRYPTION_KEY: key, CACHE: cache,
  ASSETS: { fetch: async () => new Response('asset') },
}) as unknown as Env
beforeAll(async () => { sessionSecret = await generateSessionSecret(); token = await createSessionToken(sessionSecret) })
async function fakeDbWithCreds() {
  const accessKeyEnc = await encryptText('AK', key)
  const secretKeyEnc = await encryptText('SK', key)
  const row = { access_key_enc: accessKeyEnc, secret_key_enc: secretKeyEnc }
  return { prepare: () => ({ bind: (..._args: unknown[]) => ({ first: async () => row, run: async () => ({ success: true }) }) }) } as unknown as D1Database
}
function fakeDbMissing() {
  return { prepare: () => ({ bind: (..._args: unknown[]) => ({ first: async () => null, run: async () => ({ success: true }) }) }) } as unknown as D1Database
}
describe('kis token route', () => {
  it('DB·키·CACHE 없으면 503이다', async () => {
    const kv = createFakeKv()
    await saveSession(kv, token)
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const res = await (await import('../../src/infra/worker.ts')).default.fetch(new Request(`https://example.com/api/accounts/${accountId}/kis-token`, { method: 'POST', headers: { Cookie: `${SESSION_COOKIE}=${token}` } }), env)
    expect(res.status).toBe(503)
  })
  it('계좌가 없으면 404이다', async () => {
    const kv = createFakeKv()
    await saveSession(kv, token)
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, DB: fakeDbMissing(), ACCOUNT_ENCRYPTION_KEY: key, CACHE: createFakeKv(), ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const res = await (await import('../../src/infra/worker.ts')).default.fetch(new Request(`https://example.com/api/accounts/${accountId}/kis-token`, { method: 'POST', headers: { Cookie: `${SESSION_COOKIE}=${token}` } }), env)
    expect(res.status).toBe(404)
  })
  it('인증이 없으면 401이다', async () => {
    const kv = createFakeKv()
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, DB: await fakeDbWithCreds(), ACCOUNT_ENCRYPTION_KEY: key, CACHE: createFakeKv(), ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const res = await (await import('../../src/infra/worker.ts')).default.fetch(new Request(`https://example.com/api/accounts/${accountId}/kis-token`, { method: 'POST' }), env)
    expect(res.status).toBe(401)
  })
  it('KIS 실패는 502이다', async () => {
    const kv = createFakeKv()
    await saveSession(kv, token)
    const fetchFn = vi.fn(async () => new Response('bad', { status: 400 }))
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, DB: await fakeDbWithCreds(), ACCOUNT_ENCRYPTION_KEY: key, CACHE: createFakeKv(), ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const { kisTokenHandler } = await import('../../src/infra/kis/kis-token-handler.ts')
    const c = { req: { param: () => accountId }, env, json: (body: unknown, status: number) => new Response(JSON.stringify(body), { status }) } as unknown as Context<{ Bindings: Env }>
    const res = await kisTokenHandler(c as any, fetchFn as unknown as typeof fetch)
    expect(res.status).toBe(502)
  })
  it('성공하면 200과 issued·expiresAt를 반환한다', async () => {
    const kv = createFakeKv()
    await saveSession(kv, token)
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ access_token: 'secret-token', expires_in: 3600 }), { status: 200 }))
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, DB: await fakeDbWithCreds(), ACCOUNT_ENCRYPTION_KEY: key, CACHE: createFakeKv(), ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const { kisTokenHandler } = await import('../../src/infra/kis/kis-token-handler.ts')
    const c = { req: { param: () => accountId }, env, json: (body: unknown, status: number) => new Response(JSON.stringify(body), { status }) } as unknown as Context<{ Bindings: Env }>
    const res = await kisTokenHandler(c as any, fetchFn as unknown as typeof fetch)
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toHaveProperty('issued')
    expect(body).toHaveProperty('expiresAt')
    expect(JSON.stringify(body)).not.toContain('secret-token')
  })
})
