import { Hono } from 'hono'
import { expect, it, vi } from 'vitest'
import { createQuoteRoutes } from '../../../src/infra/quotes/routes'
vi.mock('../../../src/infra/accounts/account-repository', () => ({
  createAccountRepository: () => ({ list: async () => [{ id: 'a' }] }),
}))
vi.mock('../../../src/infra/kis/kis-context', () => ({
  kisClientFromEnv: (_c: unknown, fetchFn: typeof fetch) => ({
    forAccount: async () => ({ request: () => fetchFn('https://injected.invalid/quote') }),
  }),
}))
it.each([200, 404, 503])('주입fetch의 %i 응답을 비밀 없이 매핑한다', async status => {
  const fetchFn = vi.fn(async () => status === 200
    ? Response.json({ rt_cd: '0', output: { stck_prpr: '70000', token: 'PRIVATE' } })
    : new Response(null, { status }))
  const put = vi.fn()
  const env = { DB: {}, CACHE: { get: async () => null, put } } as unknown as Env
  const app = new Hono<{ Bindings: Env }>().route('/api', createQuoteRoutes(fetchFn))
  const response = await app.request('/api/quotes/005930', {}, env)
  expect(response.status).toBe(status)
  const body = await response.json()
  expect(JSON.stringify(body)).not.toContain('PRIVATE')
  expect(fetchFn).toHaveBeenCalledTimes(1)
  if (status === 200) {
    expect(body).toEqual({ code: '005930', price: 70000, asOf: expect.any(String) })
    expect(put).toHaveBeenCalledWith('quote:005930', expect.any(String), { expirationTtl: 60 })
  } else {
    expect(body).toEqual({ code: status === 404 ? 'STOCK_NOT_FOUND' : 'STOCK_LOOKUP_UNAVAILABLE' })
    expect(put).not.toHaveBeenCalled()
  }
})
