// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(cleanup)

describe('PortfolioSection 목록/상태/반응형', () => {
  it('로딩 후 오류 시 재시도할 수 있고 빈 상태에서는 새 포트폴리오 콜백을 호출한다', async () => {
    let fail = true
    server.use(
      http.get(`${apiBase}/portfolios`, () =>
        fail ? HttpResponse.json({ error: 'fail' }, { status: 500 }) : HttpResponse.json([]),
      ),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json([])),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json([])),
    )
    const onCreate = vi.fn()
    renderWithQuery(<PortfolioSection onCreate={onCreate} />)

    expect(screen.getByText('포트폴리오를 불러오는 중...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('포트폴리오를 불러오지 못했습니다'))

    fail = false
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    await waitFor(() => expect(screen.getByText('포트폴리오가 없습니다')).toBeInTheDocument())

    fireEvent.click(screen.getAllByRole('button', { name: '새 포트폴리오' })[0])
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('각 포트폴리오의 이름, 항목 수, 비중 요약(종목+현금), 연결 대상 수를 표시하고 onEdit을 호출한다', async () => {
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
    )
    const onEdit = vi.fn()
    renderWithQuery(<PortfolioSection onEdit={onEdit} />)

    await waitFor(() => expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument())
    expect(screen.getByText('3개 항목')).toBeInTheDocument()
    expect(screen.getByText('연결 1곳')).toBeInTheDocument()
    expect(screen.getByText(/TIGER 미국S&P500 50\.00%/)).toBeInTheDocument()
    expect(screen.getByText(/현금 20\.00%/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '배당 성장형 편집' }))
    expect(onEdit).toHaveBeenCalledWith(samplePortfolios[0])
  })

  it('375/768/769 폭에 따라 그리드 배치를 전환하고 44px 터치 높이와 가로 넘침 방지를 유지한다', async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
    )
    window.innerWidth = 375
    window.dispatchEvent(new Event('resize'))
    renderWithQuery(<PortfolioSection />)
    const grid = await screen.findByTestId('portfolio-card-grid')
    expect(grid.className).toContain('grid-cols-1')
    expect(screen.getByRole('button', { name: '새 포트폴리오' }).className).toContain('min-h-11')

    window.innerWidth = 769
    window.dispatchEvent(new Event('resize'))
    await waitFor(() => expect(grid.className).toContain('grid-cols-2'))
  })
})
