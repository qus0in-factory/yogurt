// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import * as fillStream from '../../../../src/app/trading/fill-stream'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'
import { REBALANCE_ORDERS_STORAGE_KEY } from '../../../../src/ui/operations/rebalance/rebalance-order-store'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/trading/fill-stream')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({
  useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }),
}))

const opt = { accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678', alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형' }
const mockInputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }], cash: 300000, cashSettled: 300000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }], prices: { '005930': 70000 },
}

describe('RebalanceSection 체결 스트림 연동', () => {
  let capturedHandler: (u: fillStream.FillUpdate) => void, capturedDone: (finished: string[]) => void

  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([opt])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false } as never)
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, onUpdate, onDone) => {
      capturedHandler = onUpdate; capturedDone = onDone ?? (() => {}); return vi.fn()
    })
  })
  afterEach(() => { cleanup(); sessionStorage.clear() })

  const renderSection = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RebalanceSection /></QueryClientProvider>)

  it('체결 상태 업데이트 시 상태 칩이 표시되고 새로고침 확인 모달에 미확인 수가 표시된다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    const confirmSpy = vi.spyOn(window, 'confirm')
    renderSection()

    act(() => capturedHandler({ orderId: 'ORD-1', status: 'open', filledQty: 0, remainingQty: 4, checkedAt: '' }))
    expect(screen.getByRole('status', { name: '미체결' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '계획 새로고침' }))
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.getByText(/1건/)).toBeInTheDocument()
  })

  it('스트림이 닫히면 체결 상태 다시 확인 버튼이 나타나고 누르면 재구독한다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    renderSection()
    expect(screen.queryByRole('button', { name: '체결 상태 다시 확인' })).not.toBeInTheDocument()

    act(() => capturedDone([]))
    const recheckBtn = screen.getByRole('button', { name: '체결 상태 다시 확인' })
    expect(recheckBtn).toBeInTheDocument()

    fireEvent.click(recheckBtn)
    expect(fillStream.subscribeFills).toHaveBeenCalledTimes(2)
  })

  it('주문 번호 없는 done은 안내 칩을 표시한다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4 },
    }))
    renderSection()
    expect(screen.getByRole('status', { name: rebalanceText.fillStatus.noOrderId })).toBeInTheDocument()
  })
})
