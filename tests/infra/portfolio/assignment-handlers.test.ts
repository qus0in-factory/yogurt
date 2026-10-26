// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assignTarget, listAssignments, portfolioExists, targetExists, unassignTarget } from '../../../src/infra/portfolio/assignment-repository.ts'
import { call } from './fixtures.ts'

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({
  listAssignments: vi.fn(), portfolioExists: vi.fn(), targetExists: vi.fn(),
  assignTarget: vi.fn(), unassignTarget: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(portfolioExists).mockResolvedValue(true)
  vi.mocked(targetExists).mockResolvedValue(true)
  vi.mocked(assignTarget).mockResolvedValue({ accountId: 'a1', productCode: '01', portfolioId: 'p1' })
  vi.mocked(listAssignments).mockResolvedValue([{ accountId: 'a1', productCode: '01', portfolioId: 'p1' }])
})

describe('portfolio 연결 API', () => {
  it('연결 목록은 200, 설정은 200, 해제는 204를 반환한다', async () => {
    expect((await call('/api/portfolio-assignments', 'GET')).status).toBe(200)
    const put = await call('/api/accounts/a1/products/01/portfolio', 'PUT', { portfolioId: 'p1' })
    expect(put.status).toBe(200)
    expect(await put.json()).toEqual({ accountId: 'a1', productCode: '01', portfolioId: 'p1' })
    expect((await call('/api/accounts/a1/products/01/portfolio', 'DELETE')).status).toBe(204)
  })

  it('IRP(29)는 400 INVALID_PRODUCT_CODE로 거부한다', async () => {
    const put = await call('/api/accounts/a1/products/29/portfolio', 'PUT', { portfolioId: 'p1' })
    expect(put.status).toBe(400)
    const putBody = await put.json() as { issues: Array<{ path: string; reason: string }> }
    expect(putBody.issues).toEqual([{ path: 'productCode', reason: 'INVALID_PRODUCT_CODE' }])
    expect((await call('/api/accounts/a1/products/29/portfolio', 'DELETE')).status).toBe(400)
    expect(vi.mocked(assignTarget)).not.toHaveBeenCalled()
    expect(vi.mocked(unassignTarget)).not.toHaveBeenCalled()
  })

  it('없는 포트폴리오·대상은 404, 잘못된 상품코드는 400이다', async () => {
    vi.mocked(portfolioExists).mockResolvedValueOnce(false)
    expect((await call('/api/accounts/a1/products/01/portfolio', 'PUT', { portfolioId: 'p1' })).status).toBe(404)
    vi.mocked(targetExists).mockResolvedValueOnce(false)
    expect((await call('/api/accounts/a1/products/01/portfolio', 'PUT', { portfolioId: 'p1' })).status).toBe(404)
    expect((await call('/api/accounts/a1/products/99/portfolio', 'PUT', { portfolioId: 'p1' })).status).toBe(400)
  })

  it('잘못된 본문은 400과 issues를 반환한다', async () => {
    const res = await call('/api/accounts/a1/products/01/portfolio', 'PUT', { portfolioId: '' })
    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_ASSIGNMENT')
  })
})
