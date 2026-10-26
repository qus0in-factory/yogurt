// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assignmentCount, createPortfolio, getPortfolio, listPortfolios, removePortfolio, updatePortfolio } from '../../../src/infra/portfolio/repository.ts'
import { app, call, draft, portfolio } from './fixtures.ts'

vi.mock('../../../src/infra/portfolio/repository.ts', () => ({
  listPortfolios: vi.fn(), getPortfolio: vi.fn(), createPortfolio: vi.fn(),
  updatePortfolio: vi.fn(), removePortfolio: vi.fn(), assignmentCount: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listPortfolios).mockResolvedValue([portfolio])
  vi.mocked(getPortfolio).mockResolvedValue(portfolio)
  vi.mocked(assignmentCount).mockResolvedValue(0)
})

describe('portfolio API 목록·저장', () => {
  it('목록은 200, 생성은 201, 수정은 200, 삭제는 204를 반환한다', async () => {
    expect((await call('/api/portfolios', 'GET')).status).toBe(200)
    expect((await call('/api/portfolios', 'POST', draft)).status).toBe(201)
    expect((await call('/api/portfolios/p1', 'PUT', draft)).status).toBe(200)
    expect((await call('/api/portfolios/p1', 'DELETE')).status).toBe(204)
  })

  it('생성 시 서버가 id와 시간을 만들고 저장 위치를 넘기지 않는다', async () => {
    await call('/api/portfolios', 'POST', draft)
    expect(vi.mocked(createPortfolio).mock.calls[0][1]).toMatchObject(draft)
    expect(vi.mocked(createPortfolio).mock.calls[0][3]).toEqual(expect.any(String))
  })

  it('잘못된 본문은 400과 경로별 issues를 반환한다', async () => {
    const res = await call('/api/portfolios', 'POST', { name: '', items: [] })
    expect(res.status).toBe(400)
    const body = await res.json() as { code: string; issues: Array<{ path: string }> }
    expect(body.code).toBe('INVALID_PORTFOLIO')
    expect(body.issues[0]).toHaveProperty('path')
  })

  it('8개 항목은 400 TOO_MANY_ITEMS로 거부하고 저장하지 않는다', async () => {
    const securities = Array.from({ length: 7 }, (_, i) => ({ kind: 'security', stockCode: `10000${i}`, stockName: `종목${i}`, targetWeightBps: 1000 }))
    const items = [...securities, { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 3000 }]
    const res = await call('/api/portfolios', 'POST', { name: '8개', items })
    expect(res.status).toBe(400)
    const body = await res.json() as { issues: Array<{ reason: string }> }
    expect(body.issues.map((issue) => issue.reason)).toContain('TOO_MANY_ITEMS')
    expect(vi.mocked(createPortfolio)).not.toHaveBeenCalled()
  })

  it('없는 포트폴리오는 404, 연결 중 삭제는 409다', async () => {
    vi.mocked(getPortfolio).mockResolvedValueOnce(null)
    expect((await call('/api/portfolios/p1', 'PUT', draft)).status).toBe(404)
    vi.mocked(assignmentCount).mockResolvedValue(2)
    const res = await call('/api/portfolios/p1', 'DELETE')
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ code: 'PORTFOLIO_IN_USE', assignedCount: 2 })
  })

  it('DB 바인딩이 없으면 503이다', async () => {
    const res = await app.request('/api/portfolios', { method: 'GET' }, {} as Env)
    expect(res.status).toBe(503)
  })
})
