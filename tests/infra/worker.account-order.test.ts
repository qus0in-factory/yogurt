// @vitest-environment node
import { beforeAll, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createSessionToken } from '../../src/infra/auth/crypto'
import { saveSession } from '../../src/infra/auth/session-store'
import { generateSessionSecret } from '../../src/infra/secrets/session-key'
import app from '../../src/infra/worker'
import { createFakeKv } from './fakes/kv'
let secret = ''
let token = ''
const sessions = createFakeKv()
beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(sessions, token)
})
function setup() {
  const rows = ['a', 'b'].map((id, sort_order) => ({ id, sort_order,
    alias: id, owner: '소유자', account_number: '12345678', created_at: '2026-01-01' }))
  const batch = vi.fn(async (statements: { args: unknown[] }[]) => {
    for (const { args: [order, id] } of statements) rows.find(row => row.id === id)!.sort_order = Number(order)
    return []
  })
  const prepare = vi.fn(() => ({
    all: async () => ({ results: [...rows].sort((a, b) => a.sort_order - b.sort_order) }),
    bind: (...args: unknown[]) => ({ args, all: async () => ({ results: [] }) }),
  }))
  return { db: { prepare, batch } as unknown as D1Database, batch, prepare }
}
const call = (body: unknown, DB?: D1Database, auth = true) => app.fetch(new Request('https://example.com/api/accounts/order', {
  method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: `session=${token}` } : {}) },
}), { DB, SESSION_SECRET: secret, SESSIONS: sessions } as Env)
it('인증된 PUT은 암호화 키 없이 새 순서의 Account 배열을 반환한다', async () => {
  const { db, batch } = setup()
  const response = await call({ ids: ['b', 'a'] }, db)
  expect(response.status).toBe(200)
  expect((await response.json() as { id: string }[]).map(account => account.id)).toEqual(['b', 'a'])
  expect(batch).toHaveBeenCalledTimes(1)
})
it.each([{}, { ids: [] }, { ids: ['a'] }, { ids: ['a', 'a'] }, { ids: ['a', 'missing'] }, '{'])('잘못된 요청 %j는 400이고 batch를 실행하지 않는다', async body => {
  const { db, batch } = setup()
  const response = await call(body, db)
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: 'invalid request' })
  expect(batch).not.toHaveBeenCalled()
})
it('미설정은 503이고 미인증은 401이다', async () => {
  expect((await call({ ids: ['a', 'b'] })).status).toBe(503)
  const { db, prepare } = setup()
  expect((await call({ ids: ['a', 'b'] }, db, false)).status).toBe(401)
  expect(prepare).not.toHaveBeenCalled()
})
it('order 라우트를 계좌 id 라우트보다 먼저 등록한다', () => {
  const source = readFileSync(new URL('../../src/infra/worker.ts', import.meta.url), 'utf8')
  expect(source.indexOf("app.put('/api/accounts/order'")).toBeGreaterThan(-1)
  expect(source.indexOf("app.put('/api/accounts/order'")).toBeLessThan(source.indexOf("app.patch('/api/accounts/:id'"))
})
