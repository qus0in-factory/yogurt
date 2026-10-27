import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'
import { REBALANCE_ORDERS_STORAGE_KEY } from '../../../../src/ui/operations/rebalance/rebalance-order-store'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({
  useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }),
}))

const optA = { accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678', alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형' }
const mockInputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }], cash: 300000, cashSettled: 300000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }], prices: { '005930': 70000 },
}

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([optA])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false } as never)
})
afterEach(() => { cleanup(); sessionStorage.clear() })

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
}

describe('RebalanceSection 구분 분리 및 새로고침 범위·확인', () => {
  it('매수 완료는 매도 행에 영향을 주지 않는다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
    }))
    renderSection()
    expect(screen.getByRole('status', { name: '완료' })).toBeInTheDocument()

    const sellInputs = {
      holdings: [{ code: '005930', name: '삼성전자', quantity: 20, sellableQuantity: 20, evaluationAmount: 1400000 }], cash: 300000, cashSettled: 300000,
      targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 5000 }], prices: { '005930': 70000 },
    }
    vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: sellInputs, isLoading: false } as never)
    cleanup()
    renderSection()

    expect(screen.queryByText('완료')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삼성전자 매매' })).toBeInTheDocument()
  })

  it('계획 새로고침은 확인 모달을 거쳐 현재 계좌·상품의 done만 지우고 다른 계좌 done과 pending·unknown은 보존한다', async () => {
    sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({
      'acc-1:01:005930:buy': { requestId: 'r1', state: 'done', orderQuantity: 4, orderId: 'ORD-1' },
      'acc-1:01:000660:buy': { requestId: 'r2', state: 'unknown', orderQuantity: 2 },
      'acc-2:22:005930:buy': { requestId: 'r3', state: 'done', orderQuantity: 10, orderId: 'ORD-3' },
    }))
    const confirmSpy = vi.spyOn(window, 'confirm')
    renderSection()

    expect(screen.getByRole('status', { name: '완료' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '계획 새로고침' }))
    expect(confirmSpy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '새로고침' }))
    expect(screen.queryByText('완료')).not.toBeInTheDocument()

    const raw = JSON.parse(sessionStorage.getItem(REBALANCE_ORDERS_STORAGE_KEY)!)
    expect(raw['acc-1:01:005930:buy']).toBeUndefined() // 현재 계좌 done 삭제
    expect(raw['acc-1:01:000660:buy']).toMatchObject({ state: 'unknown' }) // unknown 보존
    expect(raw['acc-2:22:005930:buy']).toMatchObject({ state: 'done' }) // 다른 계좌 done 보존
  })
})
