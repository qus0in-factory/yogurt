// @vitest-environment node
import { describe, expect, it } from 'vitest'
import app from '../../src/infra/worker.ts'
import { createFakeKv } from './fakes/kv.ts'

const fakeSessions = createFakeKv()
const makeEnv = (password?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSION_SECRET: 'dummy', SESSIONS: fakeSessions, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env

describe('middleware', () => {
  it('인증 없는 /api/* 는 401이다', async () => {
    const res = await app.fetch(new Request('https://example.com/api/missing'), makeEnv('secret'))
    expect(res.status).toBe(401)
  })
})
