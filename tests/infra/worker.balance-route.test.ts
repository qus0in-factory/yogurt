// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { encryptText } from '../../src/infra/accounts/account-crypto.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { createFakeKv } from './fakes/kv'
import app from '../../src/infra/worker.ts'

let secret = ''
let token = ''
const sessions = createFakeKv()
const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
const credsDb = (row: unknown) =>
  ({ prepare: () => ({ bind: () => ({ first: async () => row }) }) }) as unknown as D1Database

const env = (db: D1Database) =>
  ({ ENVIRONMENT: 'test', SESSION_SECRET: secret, SESSIONS: sessions, DB: db, CACHE: createFakeKv(), ACCOUNT_ENCRYPTION_KEY: envKey, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env
const call = (path: string, db: D1Database, auth = true) => app.fetch(new Request(`https://example.com${path}`, {
  headers: auth ? { Cookie: `${SESSION_COOKIE}=${token}` } : {},
}), env(db))

beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(sessions, token)
})

describe('잔고 라우트 등록', () => {
  it('인증이 없으면 401이다', async () => {
    expect((await call('/api/accounts/a1/products/29/balance', credsDb(null), false)).status).toBe(401)
  })

  it('허용되지 않은 상품코드는 400이다', async () => {
    expect((await call('/api/accounts/a1/products/99/balance', credsDb(null))).status).toBe(400)
  })

  it('등록되지 않은 계좌 ID는 404이다', async () => {
    const res = await call('/api/accounts/a1/products/29/balance', credsDb(null))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'account not found' })
  })
})
