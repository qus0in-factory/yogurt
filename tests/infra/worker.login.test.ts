// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import app from '../../src/infra/worker.ts'

let sessionSecret = ''
const makeEnv = (password?: string, secret?: string) =>
  ({ ENVIRONMENT: 'test', LOGIN_PASSWORD: password, SESSION_SECRET: secret, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env
const callLogin = (body: string, env = makeEnv('secret', sessionSecret)) => app.fetch(new Request('https://example.com/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }), env)
const login = (password: string, env?: Env) => callLogin(JSON.stringify({ password }), env)

beforeAll(async () => { sessionSecret = await generateSessionSecret() })

describe('login', () => {
  it('올바른 비밀번호는 204와 보안 쿠키를 반환한다', async () => {
    const res = await login('secret')
    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toContain('HttpOnly')
    expect(res.headers.get('set-cookie')).toContain('Secure')
    expect(res.headers.get('set-cookie')).toContain('SameSite=Strict')
  })

  it('틀린 비밀번호는 401이다', async () => expect((await login('wrong')).status).toBe(401))

  it.each(['{', 'null', '{}', '{"password":""}', '{"password":5}'])('잘못된 JSON 또는 스키마는 400이다', async body => {
    const res = await callLogin(body)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid request' })
  })

  it('설정 누락과 잘못된 세션 키는 503이다', async () => {
    expect((await login('secret', makeEnv('secret', undefined))).status).toBe(503)
    expect((await login('secret', makeEnv(undefined, sessionSecret))).status).toBe(503)
    expect((await login('secret', makeEnv('secret', 'invalid'))).status).toBe(503)
  })
})
