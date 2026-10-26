// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import { listPortfolios } from '../../src/infra/portfolio/repository.ts'
import { createFakeKv } from './fakes/kv.ts'
import app from '../../src/infra/worker.ts'

vi.mock('../../src/infra/portfolio/repository.ts', () => ({
  listPortfolios: vi.fn(), getPortfolio: vi.fn(), createPortfolio: vi.fn(),
  updatePortfolio: vi.fn(), removePortfolio: vi.fn(), assignmentCount: vi.fn(),
}))

let secret = ''
let token = ''
const sessions = createFakeKv()
const env = () => ({ ENVIRONMENT: 'test', SESSION_SECRET: secret, SESSIONS: sessions, DB: {}, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env
const call = (auth = true) => app.fetch(new Request('https://example.com/api/portfolios', {
  headers: auth ? { Cookie: `${SESSION_COOKIE}=${token}` } : {},
}), env())

beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(sessions, token)
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listPortfolios).mockResolvedValue([])
})

describe('portfolio worker route', () => {
  it('인증이 없으면 401이다', async () => {
    const res = await call(false)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('인증이 있으면 포트폴리오 목록을 반환한다', async () => {
    const res = await call()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('응답에 비밀·SQL 문장을 담지 않는다', async () => {
    const res = await call()
    const text = await res.text()
    expect(text).not.toMatch(/SELECT|INSERT|PRAGMA/i)
  })
})
