// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Portfolio } from '../../../../src/domain/portfolio/portfolio'
import { PortfolioPieChart } from '../../../../src/ui/operations/portfolio-list/PortfolioPieChart'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(cleanup)

describe('포트폴리오 복제 및 미리 보기 파이 차트', () => {
  it('복제 버튼 클릭 시 40자 제한 복사본 이름과 항목으로 생성 모드를 열고 POST로만 저장하며 연결은 복사하지 않는다', async () => {
    const longPortfolio: Portfolio = {
      ...samplePortfolios[0], id: 'p-long',
      name: '가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나다라마바사12345',
    }
    const postSpy = vi.fn()
    const putSpy = vi.fn()
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json([longPortfolio])),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json([{ accountId: 'acc-1', productCode: '01', portfolioId: 'p-long' }])),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
      http.post(`${apiBase}/portfolios`, async ({ request }) => {
        const body = (await request.json()) as { name: string; items: Portfolio['items'] }
        postSpy(body)
        return HttpResponse.json({ ...body, id: 'p-copy', createdAt: '2026-10-26', updatedAt: '2026-10-26' }, { status: 201 })
      }),
      http.put(`${apiBase}/portfolios/:id`, () => { putSpy(); return HttpResponse.json(longPortfolio) }),
    )
    renderWithQuery(<PortfolioSection />)
    await waitFor(() => expect(screen.getByRole('button', { name: `${longPortfolio.name} 복제` })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: `${longPortfolio.name} 복제` }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByText(/연결된 .*개 대상의 목표가 함께 변경됩니다/)).not.toBeInTheDocument()

    const nameInput = within(dialog).getByLabelText('포트폴리오 이름') as HTMLInputElement
    expect(nameInput.value.endsWith(' (복사본)')).toBe(true)
    expect(nameInput.value.length).toBeLessThanOrEqual(40)

    fireEvent.click(within(dialog).getByRole('button', { name: '저장' }))
    await waitFor(() => expect(postSpy).toHaveBeenCalledTimes(1))
    expect(putSpy).not.toHaveBeenCalled()
    expect(postSpy.mock.calls[0][0].items).toEqual(longPortfolio.items)
  })

  it('파이 차트 조각 비율·현금 조각·범례·접근성 속성을 표시하고, 상위 7개+기타 묶음 및 합계 비정상 안내를 처리한다', () => {
    const manyItemsPortfolio: Portfolio = {
      id: 'p-many', name: '다중자산', createdAt: '2026-10-26', updatedAt: '2026-10-26',
      items: [
        { kind: 'security', stockCode: 'A1', stockName: '종목1', targetWeightBps: 2000 },
        { kind: 'security', stockCode: 'A2', stockName: '종목2', targetWeightBps: 1800 },
        { kind: 'security', stockCode: 'A3', stockName: '종목3', targetWeightBps: 1600 },
        { kind: 'security', stockCode: 'A4', stockName: '종목4', targetWeightBps: 1400 },
        { kind: 'security', stockCode: 'A5', stockName: '종목5', targetWeightBps: 1200 },
        { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 1000 },
        { kind: 'security', stockCode: 'A6', stockName: '종목6', targetWeightBps: 600 },
        { kind: 'security', stockCode: 'A7', stockName: '종목7', targetWeightBps: 400 },
      ],
    }
    const { rerender } = render(<PortfolioPieChart portfolio={manyItemsPortfolio} />)
    const svg = screen.getByRole('img', { name: /다중자산/ })
    expect(svg).toBeInTheDocument()
    const slices = screen.getAllByTestId('pie-slice')
    expect(slices).toHaveLength(8)
    expect(slices[0]).toHaveAttribute('data-weight-bps', '2000')
    expect(slices[7]).toHaveAttribute('data-slice-label', '기타')
    expect(slices[7]).toHaveAttribute('data-weight-bps', '400')
    expect(screen.getByText('현금/예수금 10.00%')).toBeInTheDocument()
    expect(screen.getByText('종목6 6.00%')).toBeInTheDocument()
    expect(screen.getByText('기타 4.00%')).toBeInTheDocument()

    const invalidPortfolio: Portfolio = { ...samplePortfolios[1], items: [{ ...samplePortfolios[1].items[0], targetWeightBps: 9000 }] }
    rerender(<PortfolioPieChart portfolio={invalidPortfolio} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('목표 비중 합계가 100.00%가 아니어서 차트를 표시할 수 없습니다')).toBeInTheDocument()
  })
})
