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
})
