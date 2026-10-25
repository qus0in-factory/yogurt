// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import app from '../../src/infra/worker.ts'
import { createFakeKv } from './fakes/kv.ts'

let secret = ''
let token = ''
const fakeSessions = createFakeKv()
const fakeDb = (accountExists = true, results: unknown[] = []) => ({
  prepare: () => ({
    bind: () => ({
      first: async () => (accountExists ? { id: 'a1' } : null),
      all: async () => ({ results }),
      run: async () => ({ success: true, meta: { changes: accountExists ? 1 : 0 } }),
    }),
  }),
}) as unknown as D1Database

const env = (db?: D1Database) => ({ ENVIRONMENT: 'test', SESSION_SECRET: secret, SESSIONS: fakeSessions, DB: db, ASSETS: { fetch: async () => new Response() } }) as unknown as Env
const call = (path: string, method = 'GET', body?: unknown, auth = true) => app.fetch(
  new Request(`https://example.com${path}`, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}) },
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  }),
  env(fakeDb()),
)

beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(fakeSessions, token)
})

describe('worker risk-classes routes', () => {
  it.each(['GET', 'PUT'])('%s 미인증 시 401을 반환한다', async method => {
    const res = await call(`/api/accounts/a1/products/29/risk-classes${method === 'PUT' ? '/005930' : ''}`, method, method === 'PUT' ? { riskClass: 'safe' } : undefined, false)
    expect(res.status).toBe(401)
  })

  it.each(['GET', 'PUT'])('%s DB 미설정 시 503을 반환한다', async method => {
    const res = await app.fetch(
      new Request(`https://example.com/api/accounts/a1/products/29/risk-classes${method === 'PUT' ? '/005930' : ''}`, { method, body: method === 'PUT' ? JSON.stringify({ riskClass: 'safe' }) : undefined, headers: { Cookie: `${SESSION_COOKIE}=${token}` } }),
      env(undefined),
    )
    expect(res.status).toBe(503)
  })

  it('잘못된 상품코드나 stockCode, body는 400이다', async () => {
    expect((await call('/api/accounts/a1/products/99/risk-classes')).status).toBe(400)
    expect((await call('/api/accounts/a1/products/99/risk-classes/005930', 'PUT', { riskClass: 'risk' })).status).toBe(400)
    expect((await call('/api/accounts/a1/products/29/risk-classes/005930', 'PUT', '{')).status).toBe(400)
    expect((await call('/api/accounts/a1/products/29/risk-classes/bad_code', 'PUT', { riskClass: 'risk' })).status).toBe(400)
    expect((await call('/api/accounts/a1/products/29/risk-classes/005930', 'PUT', { riskClass: 'invalid' })).status).toBe(400)
  })

  it.each(['GET', 'PUT'])('%s 계좌가 없으면 404이다', async method => {
    const res = await app.fetch(
      new Request(`https://example.com/api/accounts/a1/products/29/risk-classes${method === 'PUT' ? '/005930' : ''}`, { method, body: method === 'PUT' ? JSON.stringify({ riskClass: 'safe' }) : undefined, headers: { Cookie: `${SESSION_COOKIE}=${token}` } }),
      env(fakeDb(false)),
    )
    expect(res.status).toBe(404)
  })

  it('GET 200 { classes } 및 PUT 200 { stockCode, riskClass } 반환한다', async () => {
    const getRes = await call('/api/accounts/a1/products/29/risk-classes')
    expect(getRes.status).toBe(200)
    expect(await getRes.json()).toEqual({ classes: {} })
    const putRes = await call('/api/accounts/a1/products/29/risk-classes/005930', 'PUT', { riskClass: 'safe' })
    expect(putRes.status).toBe(200)
    expect(await putRes.json()).toEqual({ stockCode: '005930', riskClass: 'safe' })
  })
})
