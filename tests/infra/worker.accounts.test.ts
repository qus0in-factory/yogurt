// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import app from '../../src/infra/worker.ts'

const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(5)))
let sessionSecret = ''
let token = ''
const fakeDb = (rows: unknown[] = []) => ({ prepare: () => ({ all: async () => ({ results: rows }), bind: (..._args: unknown[]) => ({ run: async () => ({ success: true }) }) }) }) as unknown as D1Database
const env = (DB?: D1Database, ACCOUNT_ENCRYPTION_KEY?: string) => ({ ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, DB, ACCOUNT_ENCRYPTION_KEY, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env
const call = (method: string, body: unknown, binding: Env, auth = true) => app.fetch(new Request('https://example.com/api/accounts', { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(auth ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }), binding)
const input = { alias: 'Primary', owner: '홍길동', accountNumber: '1234-5678', accessKey: 'AK_plain_1234', secretKey: 'SK_plain_secret' }

beforeAll(async () => { sessionSecret = await generateSessionSecret(); token = await createSessionToken(sessionSecret) })

describe('account routes', () => {
  it('POST 입력 검증 실패는 400이다', async () => {
    expect((await call('POST', { ...input, accountNumber: '12' }, env(fakeDb(), key))).status).toBe(400)
  })

  it('POST 저장소 누락과 잘못된 키는 503이다', async () => {
    expect((await call('POST', input, env(undefined, key))).status).toBe(503)
    expect((await call('POST', input, env(fakeDb(), 'bad-key'))).status).toBe(503)
  })

  it('인증이 없으면 401이다', async () => {
    expect((await call('GET', undefined, env(fakeDb(), key), false)).status).toBe(401)
  })

  it('POST는 201과 새 Account 계약을 반환한다', async () => {
    const res = await call('POST', input, env(fakeDb(), key))
    const account = await res.json() as Record<string, unknown>
    expect(res.status).toBe(201)
    expect(account).toMatchObject({ alias: 'Primary', owner: '홍길동', accountNumber: '1234-5678' })
    expect(account).not.toHaveProperty('secretKey')
    expect(JSON.stringify(account)).not.toContain('AK_plain_1234')
    expect(JSON.stringify(account)).not.toContain('SK_plain_secret')
  })

  it('GET은 D1 목록을 새 Account 계약으로 반환한다', async () => {
    const rows = [{ id: '1', alias: 'Main', owner: '홍길동', account_number: '1234-5678', created_at: '2026-01-01T00:00:00.000Z' }]
    const res = await call('GET', undefined, env(fakeDb(rows), key))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: '1', alias: 'Main', owner: '홍길동', accountNumber: '1234-5678', createdAt: rows[0].created_at }])
  })
})
