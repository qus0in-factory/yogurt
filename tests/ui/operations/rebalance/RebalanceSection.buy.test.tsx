// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'

vi.mock('../../../../src/app/rebalance/useRebalanceInputs')

const mockOption = {
  accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678',
  alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형',
}

describe('RebalanceSection 매수 항목 및 시세 부재 검증', () => {
  afterEach(cleanup)

  it('신규 매수(현재 0) 및 추가 매수(주문=목표-현재) 행이 표에 표시된다', () => {
    const inputs = {
      holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }],
      cash: 1300000,
      targets: [
        { kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 6000 },
        { kind: 'stock' as const, code: '000660', name: 'SK하이닉스', weightBps: 4000 },
      ],
      prices: { '005930': 70000, '000660': 100000 },
    }
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs, isLoading: false } as any)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)

    expect(screen.getByText('SK하이닉스')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
    const buyChips = screen.getAllByRole('status', { name: '매수' })
    expect(buyChips).toHaveLength(2)
    expect(buyChips[0]).toHaveTextContent('매수')
    expect(screen.getByText('신규')).toBeInTheDocument()
    expect(screen.getByText('추가')).toBeInTheDocument()
  })

  it('가격이 없는 매수 항목은 가격 없음으로 표시되고 실행 버튼이 비활성화된다', () => {
    const inputs = {
      holdings: [],
      cash: 500000,
      targets: [{ kind: 'stock' as const, code: '035420', name: 'NAVER', weightBps: 10000 }],
      prices: {},
    }
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs, isLoading: false } as any)

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)

    expect(screen.getByText('NAVER')).toBeInTheDocument()
    const noPriceBtns = screen.getAllByRole('button', { name: 'NAVER 가격 없음' })
    expect(noPriceBtns[0]).toBeDisabled()
  })
})
