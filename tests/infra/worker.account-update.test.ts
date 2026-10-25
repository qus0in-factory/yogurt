// @vitest-environment node
import { beforeAll, expect, it } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import app from '../../src/infra/worker.ts'
import { createFakeKv } from './fakes/kv.ts'

let secret = ''
let token = ''
const fakeSessions = createFakeKv()
const row = { id: 'a1', alias: '수정', owner: '김철수', account_number: '12345678', created_at: '2026-01-01T00:00:00.000Z' }
const db = (found = true) => ({ prepare: (sql: string) => ({ bind: (..._args: unknown[]) => ({ first: async () => (found ? row : null), all: async () => ({ results: sql.includes('account_products') ? [] : (found ? [row] : []) }) }), all: async () => ({ results: sql.includes('account_products') ? [] : (found ? [row] : []) }) }) }) as unknown as D1Database
const input = { alias: '수정', owner: '김철수' }
const call = (body: unknown, DB: D1Database | undefined, authenticated = true) => app.fetch(
  new Request('https://example.com/api/accounts/a1', {
    method: 'PATCH', body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: `session=${token}` } : {}) },
  }),
  { DB, SESSION_SECRET: secret, SESSIONS: fakeSessions } as Env,
)
beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(fakeSessions, token)
})

it('PATCH는 키 설정 없이 200과 수정 계좌를 반환한다', async () => {
  const res = await call(input, db())
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ id: 'a1', ...input, accountNumber: row.account_number, products: [], productPlans: {}, createdAt: row.created_at })
})

it.each([{ alias: '', owner: '김철수' }, { alias: '수정', owner: '' }])('PATCH 검증 실패는 400이다', async body => {
  const res = await call(body, db())
  expect(res.status).toBe(400)
  expect(await res.json()).toEqual({ error: 'invalid request' })
})

it('대상이 없으면 404다', async () => {
  const res = await call(input, db(false))
  expect(res.status).toBe(404)
  expect(await res.json()).toEqual({ error: 'account not found' })
})

it('미인증 PATCH는 401이다', async () => {
  expect((await call(input, db(), false)).status).toBe(401)
})

it('DB 미설정이면 503이다', async () => {
  const res = await call(input, undefined)
  expect(res.status).toBe(503)
  expect(await res.json()).toEqual({ error: 'accounts storage is not configured' })
})
