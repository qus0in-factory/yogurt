import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { IrpSummary } from '../../../src/ui/overview/IrpSummary'

const summary = { totalEvaluation: 13000, cash: 1000, profitLoss: 2000, purchaseAmount: 10000 }
afterEach(cleanup)

describe('IrpSummary', () => {
  it('총평가금액을 강조하고 나머지 라벨을 작은 회색 글자로 표시한다', () => {
    render(<IrpSummary summary={summary} />)
    const total = screen.getByText('13,000원')
    expect(total).toHaveClass('text-2xl', 'font-semibold')
    expect(total.closest('div')).toHaveClass('rounded-lg', 'bg-primary-50', 'p-4')
    expect(screen.getByText('총평가금액')).toHaveClass('text-xs', 'text-stone-500')
    expect(screen.getByText('예수금')).toHaveClass('text-xs', 'text-stone-500')
    expect(screen.getByText('평가손익')).toHaveClass('text-xs', 'text-stone-500')
    expect(screen.getByText('수익률')).toHaveClass('text-xs', 'text-stone-500')
    expect(screen.getByText('1,000원')).toBeInTheDocument()
  })

  it('양수 손익과 수익률은 + 부호와 빨간색이다', () => {
    render(<IrpSummary summary={summary} />)
    expect(screen.getByText('+2,000원')).toHaveClass('text-red-600')
    expect(screen.getByText('+20%')).toHaveClass('text-red-600')
  })

  it('음수 손익과 수익률은 - 부호와 파란색이다', () => {
    render(<IrpSummary summary={{ ...summary, profitLoss: -2000, purchaseAmount: 20000 }} />)
    expect(screen.getByText('-2,000원')).toHaveClass('text-blue-600')
    expect(screen.getByText('-10%')).toHaveClass('text-blue-600')
  })

  it('0 손익과 매입금액 0이면 부호 없이 회색 0이다', () => {
    render(<IrpSummary summary={{ ...summary, profitLoss: 0, purchaseAmount: 0 }} />)
    expect(screen.getByText('0원')).toHaveClass('text-stone-500')
    expect(screen.getByText('0%')).toHaveClass('text-stone-500')
  })

  it('위험자산 비중을 예수금 포함 소수 두 자리로 표시한다', () => {
    render(<IrpSummary summary={summary} risk={{ ratio: 70, exceeds: false }} />)
    expect(screen.getByText('위험자산 비중 70.00% (예수금 포함)')).toBeInTheDocument()
    expect(screen.getByText('13,000원').closest('div')).toHaveClass('bg-primary-50')
    expect(screen.queryByText('위험자산 70% 초과')).not.toBeInTheDocument()
  })

  it('70%를 초과하면 카드와 배지를 강조한다', () => {
    render(<IrpSummary summary={summary} risk={{ ratio: 92.31, exceeds: true }} />)
    expect(screen.getByText('13,000원').closest('div')).toHaveClass('border-red-300', 'bg-red-50', 'text-red-700')
    const badge = screen.getByText('위험자산 70% 초과')
    expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    expect(badge.parentElement?.querySelector('svg')).toBeInTheDocument()
  })
})
