// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../../src/app/trading/orders-client'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({
  useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }),
}))

const mockOption = {
  accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678',
  alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형',
}
const mockInputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }],
  cash: 300000, cashSettled: 300000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70000 },
}

describe('RebalanceSection', () => {
  beforeEach(() => {
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false, isFetching: false, isError: false, dataUpdatedAt: 1 } as any)
    vi.mocked(client.checkPreOrder).mockResolvedValue({
      code: '005930', side: 'buy', availableQuantity: 4, estimatedAmount: 280000, price: 70000,
    })
    vi.mocked(client.executeOrder).mockResolvedValue({ success: true, orderId: 'ORD-99999' })
  })
  afterEach(cleanup)

  it('표 계산 결과를 렌더링하고 일괄 실행 버튼은 존재하지 않는다', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)

    expect(screen.getByText('삼성전자')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '매수' })).toBeInTheDocument()
    expect(screen.getAllByText('280,000원').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/일괄\s*실행/)).not.toBeInTheDocument()
    expect(screen.queryByText(/전체\s*실행/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /목표 대비 보기/ })).toBeInTheDocument()
  })

  it('매매 버튼을 누르면 매매 확인 대화상자가 열리고 실행 후 완료 상태로 변경된다', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)

    const tradeBtn = screen.getByRole('button', { name: '삼성전자 매매' })
    expect(tradeBtn).toHaveClass('min-h-11')
    fireEvent.click(tradeBtn)

    expect(await screen.findByRole('dialog', { name: '매매 확인' })).toBeInTheDocument()
    expect(client.executeOrder).not.toHaveBeenCalled()

    const execBtn = screen.getByRole('button', { name: '실행' })
    fireEvent.click(execBtn)

    expect(await screen.findByRole('status', { name: '완료' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삼성전자 매매' })).not.toBeInTheDocument()
  })

  it('연금저축(22) 선택 시 목표 대비 보기 영역은 표시되지 않는다', () => {
    const pensionOption = { ...mockOption, productCode: '22' as const }
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([pensionOption])
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)

    expect(screen.queryByRole('button', { name: /목표 대비 보기/ })).not.toBeInTheDocument()
  })
})
