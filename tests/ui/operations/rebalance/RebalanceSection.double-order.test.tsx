import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../../src/app/trading/orders-client'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({ useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }) }))

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
afterEach(() => { cleanup(); sessionStorage.clear() })

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
}

describe('RebalanceSection requestId 보존 및 결과 불명 잠금', () => {
  it('네트워크 오류 후 대화상자를 닫고 다시 열어도 같은 requestId를 유지한다', async () => {
    const ids: string[] = []
    vi.mocked(client.executeOrder).mockImplementation(async (input) => {
      ids.push(input.requestId); throw new Error('Fetch failed')
    })
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('주문 상태를 알 수 없습니다. 같은 화면에서 같은 요청으로만 확인하세요.')
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 주문 결과 확인 필요' }))
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('주문 상태를 알 수 없습니다. 같은 화면에서 같은 요청으로만 확인하세요.')

    expect(ids).toHaveLength(2)
    expect(ids[0]).toBe(ids[1])
  })

  it('UNKNOWN 결과 시 완료 표시 없이 잠기며 같은 requestId로 재확인한다', async () => {
    let capturedId = ''
    vi.mocked(client.executeOrder).mockImplementation(async (input) => {
      capturedId = input.requestId; return { success: false, failureCode: 'UNKNOWN', message: '확인 필요' }
    })
    renderSection()

    fireEvent.click(screen.getByRole('button', { name: '삼성전자 매매' }))
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    await screen.findByText('확인 필요')
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByText('완료')).not.toBeInTheDocument()
    const lockBtn = screen.getByRole('button', { name: '삼성전자 주문 결과 확인 필요' })
    expect(lockBtn).toBeInTheDocument()

    let retryId = ''
    vi.mocked(client.executeOrder).mockImplementation(async (input) => {
      retryId = input.requestId; return { success: true, orderId: 'ORD-999' }
    })
    fireEvent.click(lockBtn)
    fireEvent.click(await screen.findByRole('button', { name: '실행' }))

    expect(retryId).toBe(capturedId)
    expect(await screen.findByRole('status', { name: '완료' })).toBeInTheDocument()
  })
})
