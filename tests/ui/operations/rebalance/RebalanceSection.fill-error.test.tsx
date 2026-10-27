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

describe('RebalanceSection 체결 스트림 오류 및 not_found 처리', () => {
  let capturedHandler: (u: any) => void, capturedDone: (finished: string[]) => void, capturedError: () => void

  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(hooks.useTargetAccounts).mockReturnValue([opt])
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false } as never)
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, onUpdate, onDone, ...rest) => {
      capturedHandler = onUpdate; capturedDone = onDone ?? (() => {}); capturedError = (rest[0] as unknown as () => void) ?? (() => {}); return vi.fn()
    })
  })
  afterEach(() => { cleanup(); sessionStorage.clear() })

  const renderSection = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RebalanceSection /></QueryClientProvider>)

  it('not_found 이벤트는 오류 안내 없이 조회 중 칩을 보이고 done을 유지한다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    renderSection()
    act(() => capturedHandler({ orderId: 'ORD-1', status: 'not_found', filledQty: 0, remainingQty: 4, checkedAt: '' }))
    expect(screen.getByRole('status', { name: rebalanceText.fillStatus.not_found })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: rebalanceText.error.fillCheckFailed })).not.toBeInTheDocument()
    const stored = JSON.parse(sessionStorage.getItem(REBALANCE_ORDERS_STORAGE_KEY)!)
    expect(stored['acc-1:01:005930:buy']).toMatchObject({ state: 'done' })
  })

  it('상한 종료 후 not_found면 다시 확인 안내와 버튼을 보인다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    renderSection()
    act(() => capturedHandler({ orderId: 'ORD-1', status: 'not_found', filledQty: 0, remainingQty: 4, checkedAt: '' }))
    act(() => capturedDone([]))
    expect(screen.getByRole('status', { name: rebalanceText.error.notFoundAfterClosed })).toBeInTheDocument()
    expect(screen.getByText(rebalanceText.noticeShort.fillNotFound)).toBeInTheDocument()
    expect(screen.queryByText(rebalanceText.error.notFoundAfterClosed)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: rebalanceText.action.recheckFills })).toBeInTheDocument()
    expect(screen.getByText(rebalanceText.action.recheckFillsShort)).toBeInTheDocument()
  })

  it('onError 또는 unknown 이벤트는 오류 안내를 띄운다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    renderSection()
    act(() => capturedError())
    expect(screen.getByRole('status', { name: rebalanceText.error.fillCheckFailed })).toBeInTheDocument()
    expect(screen.getByText(rebalanceText.noticeShort.fillFailed)).toBeInTheDocument()
    expect(screen.queryByText(rebalanceText.error.fillCheckFailed)).not.toBeInTheDocument()
  })
})
