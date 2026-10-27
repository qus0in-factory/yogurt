// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../../../src/infra/worker.ts'
import { generateSessionSecret } from '../../../src/infra/secrets/session-key.ts'
import { createFakeKv } from '../fakes/kv.ts'

afterEach(() => vi.useRealTimers())
describe('GET /api/market/status', () => {
  it('returns 401 without authentication', async () => {
    const response = await worker.fetch(new Request('https://example.com/api/market/status'), {} as Env)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'unauthorized' })
  })
  it('returns 200 with a valid session and uses server time', async () => {
    const env = {
      LOGIN_PASSWORD: 'secret', SESSION_SECRET: await generateSessionSecret(), SESSIONS: createFakeKv(),
    } as unknown as Env
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-27T00:00:00Z'))
    const loginRequest = () => new Request('https://example.com/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret' }),
    })
    const login = await worker.fetch(loginRequest(), env)
    expect(login.status).toBe(204)
    let cookie = login.headers.get('set-cookie')!.split(';')[0]
    const request = () => new Request('https://example.com/api/market/status?now=2000-01-01', {
      headers: { Cookie: cookie },
    })
    const response = await worker.fetch(request(), env)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      open: true, reason: 'open', nextOpenAt: '2026-10-28T00:00:00.000Z',
    })
    vi.setSystemTime(new Date('2026-12-25T01:00:00Z'))
    const holidayLogin = await worker.fetch(loginRequest(), env)
    cookie = holidayLogin.headers.get('set-cookie')!.split(';')[0]
    expect(await (await worker.fetch(request(), env)).json()).toEqual({
      open: false, reason: 'holiday', nextOpenAt: '2026-12-28T00:00:00.000Z',
    })
  })
})
