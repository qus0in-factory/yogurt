import { expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { createPortfolio, deletePortfolio, listPortfolios, updatePortfolio } from '../../../src/app/portfolio/client'
import { clearPortfolioAssignment, listPortfolioAssignments, setPortfolioAssignment } from '../../../src/app/portfolio/assignments-client'
import { PortfolioApiError } from '../../../src/app/portfolio/errors'
import { base, draft, server } from './fixtures'

const calls = [
  () => listPortfolios(), () => createPortfolio(draft), () => updatePortfolio('p', draft),
  () => deletePortfolio('p'), () => listPortfolioAssignments(),
  () => setPortfolioAssignment('a', '01', 'p'), () => clearPortfolioAssignment('a', '01'),
]
it.each([400, 404, 409, 503])('모든 함수가 HTTP %s의 구조화 오류를 유지한다', async status => {
  const body = { error: 'failure', code: status === 409 ? 'PORTFOLIO_IN_USE' : 'INVALID_PORTFOLIO',
    issues: [{ path: ['items', 0, 'targetWeightBps'], reason: 'INVALID_WEIGHT' }], assignedCount: 2 }
  server.use(http.all(`${base}/*`, () => HttpResponse.json(body, { status })))
  await Promise.all(calls.map(async call => {
    const error = await call().catch(value => value)
    expect(error).toBeInstanceOf(PortfolioApiError)
    expect(error).toMatchObject({ status, code: body.code, issues: body.issues, body })
    expect(error.cause.response.status).toBe(status)
  }))
})
it('JSON이 아닌 오류도 HTTP 상태를 유지한다', async () => {
  server.use(http.get(`${base}/portfolios`, () => new HttpResponse('unavailable', { status: 503 })))
  await expect(listPortfolios()).rejects.toMatchObject({ status: 503, issues: [], body: null })
})
it('코드 없는 기존 인증 오류도 유지한다', async () => {
  server.use(http.get(`${base}/portfolios`, () => HttpResponse.json({ error: 'unauthorized' }, { status: 401 })))
  await expect(listPortfolios()).rejects.toMatchObject({ status: 401, code: undefined, issues: [] })
})
it('네트워크 오류를 HTTP 오류로 위장하지 않는다', async () => {
  server.use(http.get(`${base}/portfolios`, () => HttpResponse.error()))
  const error = await listPortfolios().catch(value => value)
  expect(error).not.toBeInstanceOf(PortfolioApiError)
})

it('A의 문자열 issue path도 변환하거나 버리지 않는다', async () => {
  const issues = [{ path: 'items.0.stockCode', reason: 'DUPLICATE_STOCK' }]
  server.use(http.post(`${base}/portfolios`, () => HttpResponse.json({
    error: 'invalid request', code: 'INVALID_PORTFOLIO', issues,
  }, { status: 400 })))
  await expect(createPortfolio(draft)).rejects.toMatchObject({ status: 400, issues })
})
