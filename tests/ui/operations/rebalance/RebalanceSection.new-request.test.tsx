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

const mockOption = { accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678', alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형' }
const mockInputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }], cash: 300000, cashSettled: 300000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }], prices: { '005930': 70000 },
}

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false, isFetching: false, isError: false, dataUpdatedAt: 1 } as never)
  vi.mocked(client.checkPreOrder).mockResolvedValue({ code: '005930', side: 'buy', availableQuantity: 4, estimatedAmount: 280000, price: 70000 })
})
afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
}

describe('RebalanceSection 확정 거부와 미확정 응답의 requestId 규칙', () => {
  it('확정 거부(ORDER_QUANTITY_EXCEEDED) 후 다시 열면 새 requestId가 발급된다', async () => {
    const ids: string[] = []
    vi.mocked(client.executeOrder).mockImplementation(async (input) => {
      ids.push(input.requestId); return { success: false, failureCode: 'ORDER_QUANTITY_EXCEEDED', message: '수량 초과' }
    })
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('수량 초과')
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('수량 초과')

    expect(ids).toHaveLength(2)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('409(ORDER_IN_PROGRESS)나 500(ORDER_FAILED) 응답 시에는 행이 잠기고 같은 requestId를 유지한다', async () => {
    const ids: string[] = []
    vi.mocked(client.executeOrder).mockImplementation(async (input) => {
      ids.push(input.requestId); return { success: false, failureCode: 'ORDER_IN_PROGRESS', message: '처리 중' }
    })
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('처리 중')
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    const lockBtn = screen.getByRole('button', { name: '삼성전자 주문 결과 확인 필요' })
    expect(lockBtn).toBeInTheDocument()

    fireEvent.click(lockBtn)
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('처리 중')

    expect(ids).toHaveLength(2)
    expect(ids[0]).toBe(ids[1])
  })
})
