// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import {
  PORTFOLIO_ASSIGNMENTS_QUERY_KEY,
  PORTFOLIOS_QUERY_KEY,
  useClearPortfolioAssignment,
  useCreatePortfolio,
  useDeletePortfolio,
  usePortfolioAssignments,
  usePortfolios,
  useSetPortfolioAssignment,
  useUpdatePortfolio,
} from '../../../src/app/portfolio/queries'
import { assignment, base, draft, portfolio, server } from './fixtures'

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children)
  return { client, wrapper }
}

describe('portfolio queries & mutations', () => {
  it('포트폴리오 목록과 연결 목록을 조회한다', async () => {
    server.use(
      http.get(`${base}/portfolios`, () => HttpResponse.json([portfolio])),
      http.get(`${base}/portfolio-assignments`, () => HttpResponse.json([assignment])),
    )
    const { wrapper } = createWrapper()
    const portfoliosRes = renderHook(() => usePortfolios(), { wrapper })
    const assignmentsRes = renderHook(() => usePortfolioAssignments(), { wrapper })
    await waitFor(() => expect(portfoliosRes.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(assignmentsRes.result.current.isSuccess).toBe(true))
    expect(portfoliosRes.result.current.data).toEqual([portfolio])
    expect(assignmentsRes.result.current.data).toEqual([assignment])
  })

  it('생성·수정은 portfolios를, 삭제는 portfolios와 assignments 모두 무효화한다', async () => {
    server.use(
      http.post(`${base}/portfolios`, () => HttpResponse.json(portfolio, { status: 201 })),
      http.put(`${base}/portfolios/p`, () => HttpResponse.json(portfolio)),
      http.delete(`${base}/portfolios/p`, () => new HttpResponse(null, { status: 204 })),
    )
    const { client, wrapper } = createWrapper()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await renderHook(() => useCreatePortfolio(), { wrapper }).result.current.mutateAsync(draft)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PORTFOLIOS_QUERY_KEY })

    invalidate.mockClear()
    await renderHook(() => useUpdatePortfolio(), { wrapper }).result.current.mutateAsync({ id: 'p', input: draft })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PORTFOLIOS_QUERY_KEY })

    invalidate.mockClear()
    await renderHook(() => useDeletePortfolio(), { wrapper }).result.current.mutateAsync('p')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PORTFOLIOS_QUERY_KEY })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY })
  })

  it('연결 설정·해제는 portfolio-assignments 쿼리를 무효화한다', async () => {
    server.use(
      http.put(`${base}/accounts/a%2Fb/products/01/portfolio`, () => HttpResponse.json(assignment)),
      http.delete(`${base}/accounts/a%2Fb/products/01/portfolio`, () => new HttpResponse(null, { status: 204 })),
    )
    const { client, wrapper } = createWrapper()
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    await renderHook(() => useSetPortfolioAssignment(), { wrapper }).result.current.mutateAsync({ accountId: 'a/b', productCode: '01', portfolioId: 'p' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY })

    invalidate.mockClear()
    await renderHook(() => useClearPortfolioAssignment(), { wrapper }).result.current.mutateAsync({ accountId: 'a/b', productCode: '01' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY })
  })
})
