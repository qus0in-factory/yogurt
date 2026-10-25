// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import { createFakeKv } from './fakes/kv.ts'
import app from '../../src/infra/worker.ts'

let sessionSecret = ''
let token = ''
beforeAll(async () => { sessionSecret = await generateSessionSecret(); token = await createSessionToken(sessionSecret) })

describe('kis status route', () => {
  it('의존성이 없으면 503이다', async () => {
    const kv = createFakeKv()
    await saveSession(kv, token)
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const res = await app.fetch(new Request('https://example.com/api/kis/status', { headers: { Cookie: `${SESSION_COOKIE}=${token}` } }), env)
    expect(res.status).toBe(503)
  })

  it('인증이 없으면 401이다', async () => {
    const kv = createFakeKv()
    const env = { ENVIRONMENT: 'test', SESSION_SECRET: sessionSecret, SESSIONS: kv, ASSETS: { fetch: async () => new Response('asset') } } as unknown as Env
    const res = await app.fetch(new Request('https://example.com/api/kis/status'), env)
    expect(res.status).toBe(401)
  })
})
