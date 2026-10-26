// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioDraft } from '../../../../src/domain/portfolio/portfolio'
import { PortfolioEditorDialog } from '../../../../src/ui/operations/portfolio/PortfolioEditorDialog'

afterEach(cleanup)

function makeDraft(count: number, withCash = false): PortfolioDraft {
  const items: PortfolioDraft['items'] = []
  const secCount = withCash ? count - 1 : count
  for (let i = 1; i <= secCount; i++) {
    items.push({ kind: 'security', stockCode: `00593${i}`, stockName: `종목${i}`, targetWeightBps: 1000 })
  }
  if (withCash) {
    items.push({ kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 1000 })
  }
  return { name: '테스트', items }
}

describe('PortfolioEditorDialog 최대 7개 항목 제한', () => {
  it('항목이 7개이면 종목 추가/현금 추가 버튼이 비활성화되고 aria-describedby 안내가 연결된다', () => {
    const draft7 = makeDraft(7, false)
    render(<PortfolioEditorDialog open initialValue={draft7} onClose={vi.fn()} onSubmit={vi.fn()} />)

    const addStockBtn = screen.getByRole('button', { name: '종목 추가' })
    const addCashBtn = screen.getByRole('button', { name: '현금 추가' })

    expect(addStockBtn).toBeDisabled()
    expect(addCashBtn).toBeDisabled()

    const notice = screen.getByText('항목은 최대 7개까지 등록할 수 있습니다')
    expect(notice).toBeInTheDocument()
    expect(addStockBtn).toHaveAttribute('aria-describedby', notice.id)
    expect(addCashBtn).toHaveAttribute('aria-describedby', notice.id)
  })

  it('항목이 6개일 때는 추가 버튼이 활성화되고 안내가 보이지 않는다', () => {
    const draft6 = makeDraft(6, false)
    render(<PortfolioEditorDialog open initialValue={draft6} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: '종목 추가' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: '현금 추가' })).not.toBeDisabled()
    expect(screen.queryByText('항목은 최대 7개까지 등록할 수 있습니다')).not.toBeInTheDocument()
  })

  it('7개 상태에서 항목을 하나 삭제하면 추가 버튼이 다시 활성화된다', () => {
    const draft7 = makeDraft(7, false)
    render(<PortfolioEditorDialog open initialValue={draft7} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: '종목 추가' })).toBeDisabled()

    const deleteButtons = screen.getAllByRole('button', { name: '항목 삭제' })
    fireEvent.click(deleteButtons[0])

    expect(screen.getByRole('button', { name: '종목 추가' })).not.toBeDisabled()
    expect(screen.queryByText('항목은 최대 7개까지 등록할 수 있습니다')).not.toBeInTheDocument()
  })

  it('현금을 포함한 7개 항목에서도 추가가 비활성화된다', () => {
    const draft7WithCash = makeDraft(7, true)
    render(<PortfolioEditorDialog open initialValue={draft7WithCash} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: '종목 추가' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '현금 추가' })).toBeDisabled()
    expect(screen.getByText('항목은 최대 7개까지 등록할 수 있습니다')).toBeInTheDocument()
  })
})
