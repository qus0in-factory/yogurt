import { expect, it, vi } from 'vitest'
import { inquirePrice, INQUIRE_PRICE } from '../../../src/infra/quotes/price'
import { Hono } from 'hono'
import { createQuoteRoutes } from '../../../src/infra/quotes/routes'
it('공식 현재가 경로·TR ID·필드만 읽고 비밀은 응답에 싣지 않는다', async () => {
  const fetchFn = vi.fn(async (_path?: unknown, _options?: unknown) => Response.json({ rt_cd: '0', output: { stck_prpr: '70000', secret: 'secret' } }))
  const request = vi.fn(async (path, options) => fetchFn(path, options))
  const result = await inquirePrice({ request }, '005930')
  expect(request).toHaveBeenCalledWith(INQUIRE_PRICE.path, { method: 'GET', trId: 'FHKST01010100', query: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: '005930' } })
  expect(result).toEqual({ code: '005930', price: 70000, asOf: expect.any(String) })
})
it.each([404, 500])('KIS HTTP %i를 404/503으로 구분한다', async status => {
  await expect(inquirePrice({ request: async () => new Response(null, { status }) }, '005930'))
    .rejects.toHaveProperty('status', status === 404 ? 404 : 503)
})
it('빈 현재가는404, KIS 오류와 손상된 가격은503이다', async () => {
  for (const [body, status] of [[{ rt_cd: '0', output: {} }, 404], [{ rt_cd: '1' }, 503], [{ rt_cd: '0', output: { stck_prpr: 'oops' } }, 503]] as const) {
    await expect(inquirePrice({ request: async () => Response.json(body) }, '005930')).rejects.toHaveProperty('status', status)
  }
})
it('잘못된 코드400·캐시200·의존성없음503은 주입fetch를 호출하지 않는다', async () => {
  const fetchFn = vi.fn()
  const app = new Hono<{ Bindings: Env }>().route('/api', createQuoteRoutes(fetchFn))
  expect((await app.request('/api/quotes/bad!', {}, {} as Env)).status).toBe(400)
  const quote = { code: '005930', price: 70000, asOf: new Date().toISOString() }
  const CACHE = { get: async () => JSON.stringify(quote) } as never
  expect(await (await app.request('/api/quotes/005930', {}, { CACHE } as unknown as Env)).json()).toEqual(quote)
  expect((await app.request('/api/quotes/005930', {}, {} as Env)).status).toBe(503)
  expect(fetchFn).not.toHaveBeenCalled()
})
