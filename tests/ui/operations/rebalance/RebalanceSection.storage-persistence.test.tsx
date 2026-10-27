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
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({ useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }) }))

const optA = { accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678', alias: 'ISA계좌', portfolioId: 'pf-1', portfolioName: '성장형' }
const optB = { accountId: 'acc-2', productCode: '22' as const, accountNumber: '87654321', alias: '연금계좌', portfolioId: 'pf-2', portfolioName: '안정형' }

const inputsA = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }], cash: 300000, cashSettled: 300000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }], prices: { '005930': 70000 },
}
const inputsB = {
  holdings: [{ code: '000660', name: 'SK하이닉스', quantity: 5, evaluationAmount: 500000 }], cash: 500000, cashSettled: 500000,
  targets: [{ kind: 'stock' as const, code: '000660', name: 'SK하이닉스', weightBps: 10000 }], prices: { '000660': 100000 },
}

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([optA, optB])
  vi.mocked(hooks.useRebalanceInputs).mockImplementation((target) => ({
    data: target?.accountId === 'acc-2' ? inputsB : inputsA, isLoading: false,
  } as never))
  vi.mocked(client.checkPreOrder).mockResolvedValue({ code: '005930', side: 'buy', availableQuantity: 4, estimatedAmount: 280000, price: 70000 })
})
afterEach(() => { cleanup(); sessionStorage.clear() })

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
}

describe('RebalanceSection 스토리지 영속성 및 계좌 전환 복원', () => {
  it('새로고침 후에도 sessionStorage의 unknown 상태와 requestId를 복원한다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'req-saved-1', state: 'unknown', updatedAt: new Date().toISOString() },
    }))
    renderSection()

    const lockBtn = screen.getByRole('button', { name: '삼성전자 주문 결과 확인 필요' })
    expect(lockBtn).toBeInTheDocument()

    let usedId = ''
    vi.mocked(client.executeOrder).mockImplementation(async (input) => {
      usedId = input.requestId; return { success: true, orderId: 'ORD-100' }
    })
    fireEvent.click(lockBtn)
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))

    expect(usedId).toBe('req-saved-1')
    expect(await screen.findByRole('status', { name: '완료' })).toBeInTheDocument()
  })

  it('계좌를 전환했다가 돌아와도 완료 및 잠금 상태가 유지된다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'req-done-1', state: 'done', orderId: 'ORD-1', updatedAt: new Date().toISOString() },
    }))
    renderSection()
    expect(screen.getByRole('status', { name: '완료' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삼성전자 매매' })).not.toBeInTheDocument()

    // 계좌 전환
    fireEvent.change(screen.getByRole('combobox', { name: '계좌 상품 선택' }), { target: { value: 'acc-2:22' } })
    expect(await screen.findByText('SK하이닉스')).toBeInTheDocument()

    // 다시 첫 번째 계좌로 복귀
    fireEvent.change(screen.getByRole('combobox', { name: '계좌 상품 선택' }), { target: { value: 'acc-1:01' } })
    expect(await screen.findByText('삼성전자')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '완료' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삼성전자 매매' })).not.toBeInTheDocument()
  })
})
