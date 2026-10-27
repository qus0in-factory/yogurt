import { Hono } from 'hono'
import { afterEach, expect, it, vi } from 'vitest'
import { createQuoteRoutes } from '../../../src/infra/quotes/routes'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler'
import { listAssignments } from '../../../src/infra/portfolio/assignment-repository'
import { getPortfolio } from '../../../src/infra/portfolio/repository'
import worker from '../../../src/infra/worker'
vi.mock('../../../src/infra/kis/kis-balance-handler', () => ({ kisBalanceHandler: vi.fn() }))
vi.mock('../../../src/infra/portfolio/assignment-repository', () => ({ listAssignments: vi.fn() }))
vi.mock('../../../src/infra/portfolio/repository', () => ({ getPortfolio: vi.fn() }))
afterEach(() => vi.resetAllMocks())
const request = () => new Hono<{ Bindings: Env }>().route('/api', createQuoteRoutes(vi.fn()))
  .request('/api/accounts/a/products/01/rebalance-inputs', {}, { DB: {} } as Env)
it.each([true, false])('기존 보유·예수금과 연결 유무(%s)에 따른 목표를 매핑한다', async linked => {
  vi.mocked(kisBalanceHandler).mockResolvedValue(Response.json({ holdings: [
    { code: '005930', name: '삼성전자', quantity: 2, currentPrice: 70000, secret: 'hidden' },
  ], summary: { cash: 12345, cashD2: 12345 } }))
  vi.mocked(listAssignments).mockResolvedValue(linked ? [{ accountId: 'a', productCode: '01', portfolioId: 'p' }] : [])
  vi.mocked(getPortfolio).mockResolvedValue({ items: [
    { kind: 'security', stockCode: '005930', stockName: '삼성전자', targetWeightBps: 10000 },
  ] } as never)
  const response = await request()
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ holdings: [{ code: '005930', name: '삼성전자', quantity: 2, currentPrice: 70000 }],
    cashAvailable: 12345, cashSettled: 12345, cash: 12345, prices: { '005930': 70000 }, priceFailed: [], hasPortfolio: linked, targets: linked ? [{ code: '005930', name: '삼성전자', weightBps: 10000, kind: 'security' }] : [] })
})
it('D+2 예수금을 cashSettled로, D+0은 cashAvailable로 내보낸다', async () => {
  vi.mocked(kisBalanceHandler).mockResolvedValue(Response.json({ holdings: [], summary: { cash: 12345, cashD2: 23456 } }))
  vi.mocked(listAssignments).mockResolvedValue([])
  const response = await request()
  expect(await response.json()).toMatchObject({ cashAvailable: 12345, cashSettled: 23456, cash: 23456 })
})
it('D+2 예수금이 없으면 cashSettled와 cash를 null로 둔다', async () => {
  vi.mocked(kisBalanceHandler).mockResolvedValue(Response.json({ holdings: [], summary: { cash: 12345 } }))
  vi.mocked(listAssignments).mockResolvedValue([])
  expect(await (await request()).json()).toMatchObject({ cashAvailable: 12345, cashSettled: null, cash: null })
})
it.each(['/api/quotes/005930', '/api/accounts/a/products/01/rebalance-inputs'])('미인증 %s는 401', async path => {
  const res = await worker.fetch(new Request(`http://localhost${path}`), {} as Env, {} as ExecutionContext)
  expect(res.status).toBe(401)
})
