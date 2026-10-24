// @vitest-environment node
import { describe, expect, it } from 'vitest'
import app from '../../src/infra/worker.ts'

const makeEnv = (password?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env

describe('health', () => {
  it('/health는 인증 없이 200이다', async () => {
    const res = await app.fetch(new Request('https://example.com/health'), makeEnv())
    expect(res.status).toBe(200)
  })

  it('/api/health는 인증 없이 200이다', async () => {
    const res = await app.fetch(new Request('https://example.com/api/health'), makeEnv('secret'))
    expect(res.status).toBe(200)
  })
})
