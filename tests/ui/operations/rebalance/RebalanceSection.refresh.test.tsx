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

describe('주문 성공 후 잔고 갱신', () => {
  beforeEach(() => {
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false, isFetching: false, isError: false, dataUpdatedAt: 1 } as never)
    vi.mocked(client.checkPreOrder).mockResolvedValue({
      code: '005930', side: 'buy', availableQuantity: 4, estimatedAmount: 280000, price: 70000,
    })
    vi.mocked(client.executeOrder).mockResolvedValue({ success: true, orderId: 'ORD-99999' })
  })
  afterEach(cleanup)

  it('주문 성공 후 입력 쿼리를 무효화한다', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const spy = vi.spyOn(qc, 'invalidateQueries')
    render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    expect(await screen.findByRole('dialog', { name: '매매 확인' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '실행' }))
    expect(await screen.findByRole('status', { name: '완료' })).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith({ queryKey: ['rebalance-inputs', 'acc-1', '01'] })
  })
})
