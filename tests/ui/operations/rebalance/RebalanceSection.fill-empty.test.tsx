// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen } from '@testing-library/react'
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

describe('RebalanceSection 추적 대상 없음 및 초기 안내 없음', () => {
  let capturedError: () => void

  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([opt])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false } as never)
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, _u, _d, ...rest) => {
      capturedError = (rest[0] as unknown as () => void) ?? (() => {})
      return vi.fn()
    })
  })
  afterEach(() => { cleanup(); sessionStorage.clear() })

  const renderSection = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RebalanceSection /></QueryClientProvider>)

  it('done이 없으면 구독 0회이고 체결 안내와 재확인 버튼이 없다', () => {
    renderSection()
    expect(fillStream.subscribeFills).not.toHaveBeenCalled()
    expect(screen.queryByRole('status', { name: rebalanceText.error.fillCheckFailed })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: rebalanceText.action.recheckFills })).not.toBeInTheDocument()
  })

  it('주문 번호가 없거나 다른 계좌의 항목만 있으면 구독하지 않고 안내를 숨긴다', () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-2:01:005930:buy': { requestId: 'r1', state: 'done', orderId: 'ORD-OTHER' },
      'acc-1:01:005930:buy': { requestId: 'r2', state: 'done' },
    }))
    renderSection()
    expect(fillStream.subscribeFills).not.toHaveBeenCalled()
    expect(screen.queryByRole('status', { name: rebalanceText.error.fillCheckFailed })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: rebalanceText.action.recheckFills })).not.toBeInTheDocument()
  })

  it('화면 첫 렌더 시 오류 안내가 없고 onError 발생 이후에만 오류 안내와 재확인 버튼이 나타난다', () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    renderSection()
    expect(fillStream.subscribeFills).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('status', { name: rebalanceText.error.fillCheckFailed })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: rebalanceText.action.recheckFills })).not.toBeInTheDocument()

    act(() => capturedError())
    expect(screen.getByRole('status', { name: rebalanceText.error.fillCheckFailed })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: rebalanceText.action.recheckFills })).toBeInTheDocument()
  })
})
