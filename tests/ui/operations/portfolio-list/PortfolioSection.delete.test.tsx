// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(cleanup)

describe('PortfolioSection 삭제 및 409 PORTFOLIO_IN_USE 처리', () => {
  it('연결이 없는 포트폴리오는 확인 후 삭제하고 목록에서 제거한다', async () => {
    let list = [...samplePortfolios]
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(list)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
      http.delete(`${apiBase}/portfolios/p-2`, () => {
        list = list.filter((item) => item.id !== 'p-2')
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderWithQuery(<PortfolioSection />)
    await waitFor(() => expect(screen.getByRole('heading', { name: '안정 현금형' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '안정 현금형 삭제' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText("'안정 현금형' 포트폴리오를 삭제할까요?")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: '삭제 확인' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: '안정 현금형' })).not.toBeInTheDocument())
  })

  it('409 PORTFOLIO_IN_USE 응답 시 연결된 대상 목록과 해제 안내를 보여주고 항목을 유지한다', async () => {
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
      http.delete(`${apiBase}/portfolios/p-1`, () =>
        HttpResponse.json(
          { error: 'portfolio is in use', code: 'PORTFOLIO_IN_USE', assignedCount: 1 },
          { status: 409 },
        ),
      ),
    )
    renderWithQuery(<PortfolioSection />)
    await waitFor(() => expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '배당 성장형 삭제' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '삭제 확인' }))

    await waitFor(() =>
      expect(within(dialog).getByRole('alert')).toHaveTextContent('먼저 연결을 해제하세요'),
    )
    expect(within(dialog).getByText(/12345678\(주계좌\) ISA/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument()
  })
})
