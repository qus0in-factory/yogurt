// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: width >= 769 && String(query).includes('769'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

function mockList() {
  server.use(
    http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
    http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
    http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
  )
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('PortfolioSection 모바일 캐러셀', () => {
  it('모바일 폭에서 캐러셀이 보이고 grid가 없다', async () => {
    setViewport(375)
    mockList()
    renderWithQuery(<PortfolioSection />)
    expect(await screen.findByLabelText('포트폴리오 목록')).toBeInTheDocument()
    expect(screen.queryByTestId('portfolio-card-grid')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 / 2')
    expect(document.querySelector('.overflow-x-hidden')).toBeInTheDocument()
  })

  it('데스크톱 폭에서 grid가 보이고 캐러셀이 없다', async () => {
    setViewport(769)
    mockList()
    renderWithQuery(<PortfolioSection />)
    const grid = await screen.findByTestId('portfolio-card-grid')
    expect(grid.className).toContain('grid-cols-2')
    expect(screen.queryByLabelText('포트폴리오 목록')).not.toBeInTheDocument()
  })

  it('카드 수와 캐러셀 페이지 수가 맞다', async () => {
    setViewport(375)
    mockList()
    renderWithQuery(<PortfolioSection />)
    await screen.findByLabelText('포트폴리오 목록')
    expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '안정 현금형' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 포트폴리오' }))
    expect(screen.getByRole('heading', { name: '안정 현금형' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 / 2')
  })

  it('캐러셀 안 카드의 편집 버튼이 편집기를 연다', async () => {
    setViewport(375)
    mockList()
    renderWithQuery(<PortfolioSection />)
    fireEvent.click(await screen.findByRole('button', { name: '배당 성장형 편집' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: '포트폴리오 수정' })).toBeInTheDocument()
  })
})
