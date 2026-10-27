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

  it('D+2 예수금으로 계좌 전체·투자 가능 금액을 계산하고 D+0·D+2 두 줄을 표시한다', () => {
    render(<RebalanceSummary holdings={mockHoldings} cashAvailable={300_000} cashSettled={500_000} keepAmount={200_000} />)

    expect(screen.getByText('계좌 전체 금액')).toBeInTheDocument()
    expect(screen.getByText('1,200,000원')).toBeInTheDocument()
    expect(screen.getByText('1,000,000원')).toBeInTheDocument()
    expect(screen.getByText('출금 가능(D+0)')).toBeInTheDocument()
    expect(screen.getByText('예수금(D+2)')).toBeInTheDocument()
    expect(screen.getByText('300,000원')).toBeInTheDocument()
    expect(screen.getByText('500,000원')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('매수 합계가 D+2 예수금 + 매도 예상 금액보다 크면 부족 안내를 표시한다', () => {
    const items: RebalanceItem[] = [
      { code: '005930', name: '삼성전자', currentQuantity: 10, targetQuantity: 19, orderQuantity: 9, side: 'buy' },
      { code: '000660', name: 'SK하이닉스', currentQuantity: 5, targetQuantity: 3, orderQuantity: 2, side: 'sell' },
    ]
    const prices = { '005930': 100_000, '000660': 100_000 }
    render(<RebalanceSummary holdings={mockHoldings} cashAvailable={100_000} cashSettled={500_000} keepAmount={0} items={items} prices={prices} />)

    expect(screen.getByText('900,000원')).toBeInTheDocument()
    expect(screen.getByText('200,000원')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '매수 가능 현금이 부족할 수 있습니다' })).toBeInTheDocument()
    expect(screen.getByText('부족')).toBeInTheDocument()
    expect(screen.queryByText('매수 가능 현금이 부족할 수 있습니다')).not.toBeInTheDocument()
  })

  it('매수 합계가 D+2 예수금 + 매도 예상 금액 이하면 부족 안내를 표시하지 않는다', () => {
    const items: RebalanceItem[] = [
      { code: '005930', name: '삼성전자', currentQuantity: 10, targetQuantity: 15, orderQuantity: 5, side: 'buy' },
      { code: '000660', name: 'SK하이닉스', currentQuantity: 5, targetQuantity: 1, orderQuantity: 4, side: 'sell' },
    ]
    const prices = { '005930': 100_000, '000660': 100_000 }
    render(<RebalanceSummary holdings={mockHoldings} cashAvailable={0} cashSettled={100_000} keepAmount={0} items={items} prices={prices} />)

    expect(screen.queryByText('매수 가능 현금이 부족할 수 있습니다')).not.toBeInTheDocument()
  })

  it('남길 금액 초과는 Summary 중복 경고 없이 0원만 표시한다', () => {
    render(<RebalanceSummary holdings={mockHoldings} cashAvailable={300_000} cashSettled={500_000} keepAmount={1_500_000} />)
    expect(screen.getAllByText('0원').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/남길 금액이 계좌 전체 금액보다 커서/)).not.toBeInTheDocument()
  })

  it('남길 금액은 리밸런싱 제외 표시와 함께 한 번 보인다', () => {
    render(<RebalanceSummary holdings={mockHoldings} cashAvailable={300_000} cashSettled={500_000} keepAmount={200_000} />)
    expect(screen.getByText('200,000원')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '리밸런싱 제외' })).toBeInTheDocument()
    expect(screen.getByText('제외')).toBeInTheDocument()
    expect(screen.queryByText('(리밸런싱 제외)')).not.toBeInTheDocument()
  })

  it('두 예수금 금액은 가리기 대상이다', () => {
    useMaskStore.setState({ masked: true })
    render(<RebalanceSummary holdings={mockHoldings} cashAvailable={300_000} cashSettled={500_000} keepAmount={200_000} />)

    expect(screen.getByText('300,000원')).toHaveClass('blur-[6px]')
    expect(screen.getByText('500,000원')).toHaveClass('blur-[6px]')
    expect(screen.getByText('1,200,000원')).toHaveClass('blur-[6px]')
  })
})
