import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../../src/app/trading/orders-client'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'
import { REBALANCE_ORDERS_STORAGE_KEY } from '../../../../src/ui/operations/rebalance/rebalance-order-store'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({
  useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }),
}))

const mockOption = { accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678', alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형' }

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
  vi.mocked(client.checkPreOrder).mockResolvedValue({ code: '005930', side: 'buy', availableQuantity: 4, estimatedAmount: 280000, price: 70000 })
})
afterEach(() => { cleanup(); sessionStorage.clear() })

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
}

describe('RebalanceSection done 상태 유지 및 실행 수량·주문번호 저장', () => {
  it('계획 수량이 변경되어도 done 상태를 자동으로 지우지 않고 유지한다', () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    // 예수금이 늘어나 주문 수량이 6주로 계산되는 새 계획
    const inputsChanged = {
      holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }], cash: 500000, cashSettled: 500000,
      targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }], prices: { '005930': 70000 },
    }
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputsChanged, isLoading: false, isFetching: false, isError: false, dataUpdatedAt: 1 } as never)
    renderSection()

    // 자동 해제되지 않고 완료 표시 유지
    expect(screen.getByRole('status', { name: '완료' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삼성전자 매매' })).not.toBeInTheDocument()
  })

  it('주문 완료 시 실제로 실행한 주문 수량과 주문 번호를 done 상태에 저장한다', async () => {
    const inputs = {
      holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }], cash: 300000, cashSettled: 300000,
      targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }], prices: { '005930': 70000 },
    }
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs, isLoading: false, isFetching: false, isError: false, dataUpdatedAt: 1 } as never)
    vi.mocked(client.executeOrder).mockResolvedValue({ success: true, orderId: 'ORD-NEW-77' })
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    // 수량을 2로 줄여서 실행
    const qtyInput = await screen.findByLabelText('주문 수량')
    fireEvent.change(qtyInput, { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: '실행' }))

    await screen.findByRole('status', { name: '완료' })
    const saved = JSON.parse(sessionStorage.getItem(REBALANCE_ORDERS_STORAGE_KEY)!)['acc-1:01:005930:buy']
    expect(saved).toMatchObject({ state: 'done', orderQuantity: 2, orderId: 'ORD-NEW-77' })
  })
})
