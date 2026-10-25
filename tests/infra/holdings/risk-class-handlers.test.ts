// @vitest-environment node
import type { Context } from 'hono'
import { expect, it, vi } from 'vitest'
import { getRiskClassesHandler, setRiskClassHandler } from '../../../src/infra/holdings/risk-class-handlers'

function setup(exists = true, configured = true) {
  const prepare = vi.fn(() => ({ bind: () => ({
    first: async () => exists ? { id: 'a1' } : null,
    all: async () => ({ results: [{ stock_code: '005930', risk_class: 'safe' }] }),
    run: async () => ({ meta: { changes: exists ? 1 : 0 } }),
  }) }))
  const params = { id: 'a1', code: '29', stockCode: '005930' }
  const json = vi.fn(async (): Promise<unknown> => ({ riskClass: 'safe' }))
  const c = { env: { DB: configured ? { prepare } : undefined }, req: {
    param: (key: keyof typeof params) => params[key], json,
  }, json: (body: unknown, status = 200) => Response.json(body, { status }) } as unknown as Context<{ Bindings: Env }>
  return { c, params, json, prepare }
}
it.each([getRiskClassesHandler, setRiskClassHandler])('DB 미설정은 503이고 SQL을 실행하지 않는다: %s', async handler => {
  const { c, prepare } = setup(true, false)
  expect((await handler(c)).status).toBe(503)
  expect(prepare).not.toHaveBeenCalled()
})
it.each([getRiskClassesHandler, setRiskClassHandler])('계좌가 없으면 404이다: %s', async handler => {
  const response = await handler(setup(false).c)
  expect(response.status).toBe(404)
  expect(await response.json()).toEqual({ error: 'account not found' })
})
it.each([getRiskClassesHandler, setRiskClassHandler])('카탈로그 밖 상품은 400이다: %s', async handler => {
  const { c, params, prepare } = setup()
  params.code = '99'
  expect((await handler(c)).status).toBe(400)
  expect(prepare).not.toHaveBeenCalled()
})
it.each(['', 'lowercase', '1234567890123', 'bad_code!'])('잘못된 종목코드 %s는 400이다', async code => {
  const { c, params, prepare } = setup()
  params.stockCode = code
  expect((await setRiskClassHandler(c)).status).toBe(400)
  expect(prepare).not.toHaveBeenCalled()
})
it.each([null, {}, { riskClass: 'other' }])('잘못된 body %j는 400이다', async body => {
  const { c, json, prepare } = setup()
  json.mockResolvedValue(body)
  expect((await setRiskClassHandler(c)).status).toBe(400)
  expect(prepare).not.toHaveBeenCalled()
})
it('JSON 파싱 실패는 400이고 SQL을 실행하지 않는다', async () => {
  const { c, json, prepare } = setup()
  json.mockRejectedValue(new SyntaxError('bad JSON'))
  const response = await setRiskClassHandler(c)
  expect(response.status).toBe(400)
  expect(await response.json()).toEqual({ error: 'invalid request' })
  expect(prepare).not.toHaveBeenCalled()
})
it('GET과 PUT의 성공 응답은 계약과 일치한다', async () => {
  const get = await getRiskClassesHandler(setup().c)
  expect(get.status).toBe(200)
  expect(await get.json()).toEqual({ classes: { '005930': 'safe' } })
  const put = await setRiskClassHandler(setup().c)
  expect(put.status).toBe(200)
  expect(await put.json()).toEqual({ stockCode: '005930', riskClass: 'safe' })
})
