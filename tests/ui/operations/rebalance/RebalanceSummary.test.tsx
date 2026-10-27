// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RebalanceHolding, RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceSummary } from '../../../../src/ui/operations/rebalance/RebalanceSummary'
import { useMaskStore } from '../../../../src/ui/state/mask-store'

const mockHoldings: RebalanceHolding[] = [
  { code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000 },
]

describe('RebalanceSummary', () => {
  afterEach(() => { cleanup(); useMaskStore.setState({ masked: false }) })

  it('계좌 전체 금액은 보유 합 + 예수금이며 남길 금액 차감 후 투자 가능 금액을 계산한다', () => {
    render(<RebalanceSummary holdings={mockHoldings} cash={300_000} keepAmount={200_000} />)

    expect(screen.getByText('계좌 전체 금액')).toBeInTheDocument()
    expect(screen.getByText('1,000,000원')).toBeInTheDocument()
    expect(screen.getByText('700,000원')).toBeInTheDocument()
    expect(screen.getByText('300,000원')).toBeInTheDocument()
    expect(screen.getByText('200,000원')).toBeInTheDocument()
    expect(screen.getByText('800,000원')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('매수 항목 합계와 매도 항목 합계를 요약에 표시하고 매수 합계는 행 합과 같다', () => {
    const items: RebalanceItem[] = [
      { code: '005930', name: '삼성전자', currentQuantity: 10, targetQuantity: 14, orderQuantity: 4, side: 'buy' },
      { code: '000660', name: 'SK하이닉스', currentQuantity: 5, targetQuantity: 2, orderQuantity: 3, side: 'sell' },
    ]
    const prices = { '005930': 70_000, '000660': 100_000 }
    render(<RebalanceSummary holdings={mockHoldings} cash={300_000} keepAmount={200_000} items={items} prices={prices} />)

    expect(screen.getByText('매수 합계')).toBeInTheDocument()
    expect(screen.getByText('280,000원')).toBeInTheDocument()
    expect(screen.getByText('매도 합계')).toBeInTheDocument()
    expect(screen.getAllByText('300,000원')).toHaveLength(2)
  })

  it('남길 금액이 계좌 전체보다 크면 투자 가능 금액은 0원이고 초과 안내를 표시한다', () => {
    const { rerender } = render(<RebalanceSummary holdings={mockHoldings} cash={300_000} keepAmount={400_000} />)
    expect(screen.getByText('400,000원')).toBeInTheDocument()
    expect(screen.getByText('600,000원')).toBeInTheDocument()

    rerender(<RebalanceSummary holdings={mockHoldings} cash={300_000} keepAmount={1_500_000} />)
    expect(screen.getAllByText('0원').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('alert')).toHaveTextContent('남길 금액이 계좌 전체 금액보다 커서 투자 가능 금액이 0원입니다.')
  })

  it('가리기 모드 활성화 시 요약 금액에 블러 클래스가 적용된다', () => {
    useMaskStore.setState({ masked: true })
    render(<RebalanceSummary holdings={mockHoldings} cash={300_000} keepAmount={200_000} />)

    expect(screen.getByText('1,000,000원')).toHaveClass('blur-[6px]')
    expect(screen.getByText('800,000원')).toHaveClass('blur-[6px]')
  })
})
