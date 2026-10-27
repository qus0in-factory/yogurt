import { Hono } from 'hono'
import { afterEach, expect, it, vi } from 'vitest'
import { rebalanceInputsSchema } from '../../../src/app/rebalance/schema'
import { createQuoteRoutes } from '../../../src/infra/quotes/routes'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler'
import { kisClientFromEnv } from '../../../src/infra/kis/kis-context'
import { listAssignments } from '../../../src/infra/portfolio/assignment-repository'
import { getPortfolio } from '../../../src/infra/portfolio/repository'
vi.mock('../../../src/infra/kis/kis-balance-handler', () => ({ kisBalanceHandler: vi.fn() }))
vi.mock('../../../src/infra/kis/kis-context', () => ({ kisClientFromEnv: vi.fn() }))
vi.mock('../../../src/infra/portfolio/assignment-repository', () => ({ listAssignments: vi.fn() }))
vi.mock('../../../src/infra/portfolio/repository', () => ({ getPortfolio: vi.fn() }))
afterEach(() => vi.resetAllMocks())
it.each([[200, false, 100], [503, false, 100], [200, true, 100], [200, false, undefined]] as const)('입력 라우트는 신규 목표 가격의 응답(%i), 캐시(%s)를 반영한다', async (status, cached, holdingPrice) => {
  vi.mocked(kisBalanceHandler).mockResolvedValue(Response.json({ holdings: [
    { code: 'A', name: '보유', quantity: 1, currentPrice: holdingPrice },
  ], summary: { cash: 1000 } }))
  vi.mocked(listAssignments).mockResolvedValue([{ accountId: 'a', productCode: '01', portfolioId: 'p' }])
  vi.mocked(getPortfolio).mockResolvedValue({ items: [
    { kind: 'security', stockCode: 'B', stockName: '신규', targetWeightBps: 10000 },
  ] } as never)
  const fetchFn = vi.fn(async (_code: RequestInfo | URL) => status === 200
    ? Response.json({ rt_cd: '0', output: { stck_prpr: '200' } }) : new Response(null, { status }))
  const forAccount = vi.fn(async () => ({ request: (_path: string, options: { query: Record<string, string> }) => fetchFn(options.query.FID_INPUT_ISCD) }))
  vi.mocked(kisClientFromEnv).mockReturnValue({ forAccount } as never)
  const CACHE = { get: async () => cached ? JSON.stringify({ code: 'B', price: 250, asOf: new Date().toISOString() }) : null, put: vi.fn() }
  const response = await new Hono<{ Bindings: Env }>().route('/api', createQuoteRoutes(fetchFn))
    .request('/api/accounts/a/products/01/rebalance-inputs', {}, { DB: {}, CACHE } as unknown as Env)
  expect(response.status).toBe(200)
  const body = rebalanceInputsSchema.parse(await response.json())
  expect(body.holdings[0].currentPrice).toBe(holdingPrice ?? 0)
  expect(body.prices).toEqual(status === 503 ? { A: 100 } : { A: holdingPrice ?? 200, B: cached ? 250 : 200 })
  expect(body.priceFailed).toEqual(status === 503 ? ['B'] : [])
  expect(fetchFn).toHaveBeenCalledTimes(cached ? 0 : holdingPrice === undefined ? 2 : 1)
  if (!cached) expect(forAccount).toHaveBeenCalledExactlyOnceWith('a')
})
