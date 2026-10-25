// @vitest-environment node
import { beforeAll, expect, it, vi } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto'
import { saveSession } from '../../src/infra/auth/session-store'
import { generateSessionSecret } from '../../src/infra/secrets/session-key'
import app from '../../src/infra/worker'
import { createFakeKv } from './fakes/kv'

let secret = ''
let token = ''
const fakeSessions = createFakeKv()
function fakeDb(changes: number) {
  const prepare = vi.fn(() => ({ bind: (..._args: unknown[]) => ({ run: async () => ({ meta: { changes } }) }) }))
  const batch = async () => [0, 1, 2].map(() => ({ meta: { changes } }))
  return { db: { prepare, batch } as unknown as D1Database, prepare }
}
const call = (DB: D1Database | undefined, authenticated = true) => app.fetch(
  new Request('https://example.com/api/accounts/a1', {
    method: 'DELETE', headers: authenticated ? { Cookie: `session=${token}` } : {},
  }),
  { DB, SESSION_SECRET: secret, SESSIONS: fakeSessions } as Env,
)
beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(fakeSessions, token)
})

it('DELETE 성공은 암호화 키 설정 없이 204와 빈 본문을 반환한다', async () => {
  const res = await call(fakeDb(1).db)
  expect(res.status).toBe(204)
  expect(await res.text()).toBe('')
})

it('삭제 대상이 없으면 404다', async () => {
  const res = await call(fakeDb(0).db)
  expect(res.status).toBe(404)
  expect(await res.json()).toEqual({ error: 'account not found' })
})

it('DB 미설정이면 503이다', async () => {
  const res = await call(undefined)
  expect(res.status).toBe(503)
  expect(await res.json()).toEqual({ error: 'accounts storage is not configured' })
})

it('미인증이면 401이며 DB를 호출하지 않는다', async () => {
  const { db, prepare } = fakeDb(1)
  const res = await call(db, false)
  expect(res.status).toBe(401)
  expect(await res.json()).toEqual({ error: 'unauthorized' })
  expect(prepare).not.toHaveBeenCalled()
})
