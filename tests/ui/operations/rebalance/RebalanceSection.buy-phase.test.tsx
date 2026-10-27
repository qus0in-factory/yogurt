// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import * as keep from '../../../../src/ui/operations/rebalance/useSavedKeepAmount'
import * as fill from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'; import * as auto from '../../../../src/ui/operations/rebalance/useRebalanceAutoRefresh'; import * as orders from '../../../../src/app/trading/orders-client'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'; import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { REBALANCE_ORDERS_STORAGE_KEY } from '../../../../src/ui/operations/rebalance/rebalance-order-store'
vi.mock('../../../../src/app/rebalance/useRebalanceInputs'); vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount'); vi.mock('../../../../src/ui/operations/rebalance/useRebalanceFillStream')
vi.mock('../../../../src/ui/operations/rebalance/useRebalanceAutoRefresh'); vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/ui/accounts/useAccounts', () => ({ useAccounts: () => ({ data: [] }) })); vi.mock('../../../../src/app/market/useMarketStatus', () => ({ useMarketStatus: () => ({ data: { open: true }, isError: false }) }))
const option = { accountId: 'a', productCode: '01' as const, accountNumber: 'a', alias: 'a', portfolioId: 'p', portfolioName: '성장' }
const inputs = (cash: number, holding = true) => ({
  holdings: holding ? [{ code: 'A', name: 'A', quantity: 100, sellableQuantity: 100, evaluationAmount: 1_000_000 }] : [],
  cashAvailable: cash, cashSettled: cash,
  targets: [{ kind: 'stock' as const, code: 'B', name: 'B', weightBps: 10000 }],
  prices: { A: 10_000, B: 10_000 } as Record<string, number>, priceFailed: [], hasPortfolio: true,
})
let latest = inputs(300_000); let events: fill.SellFillEvent[] = []; const refresh = vi.fn()
beforeEach(() => {
  latest = inputs(300_000); events = []; refresh.mockClear(); sessionStorage.clear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option])
  vi.mocked(hooks.useRebalanceInputs).mockImplementation(() => ({ data: latest, dataUpdatedAt: Math.max(Date.now(), ...events.map((e) => e.at)) + 1, isError: false, isLoading: false, isFetching: false } as never))
  vi.mocked(keep.useSavedKeepAmount).mockReturnValue({ keepAmount: 300_000, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() })
  vi.mocked(auto.useRebalanceAutoRefresh).mockReturnValue({ refresh })
  vi.mocked(fill.useRebalanceFillStream).mockImplementation(() => ({
    fillStatusesByKey: {}, fillEventsByKey: {}, isStreamClosed: false, isStreamError: false, showCheckFailed: false, showNotFoundClosed: false,
    remainingCount: 0, unconfirmedCount: 0, noOrderIdKeys: new Set(), reconnect: vi.fn(), hasDoneOrders: false, sellEvents: events, fillEventList: [],
  }))
})
afterEach(() => { cleanup(); sessionStorage.clear() })
const renderSection = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RebalanceSection /></QueryClientProvider>)
const buyButton = () => screen.getByRole('button', { name: 'B 매매' })
it('마지막 매도 종료 이후 성공 조회가 있으면 이전 filled 이벤트도 게이트를 연다', () => {
  latest = inputs(1_000_000)
  events = [{ pair: 'A:sell', status: 'filled', at: Date.now() - 100_000 }]
  renderSection()
  expect(buyButton()).toBeEnabled()
  expect(screen.queryByText(rebalanceText.buyWait)).not.toBeInTheDocument()
  expect(vi.mocked(orders.executeOrder)).not.toHaveBeenCalled()
})
it('filled 후 재조회 1회, 한도 700,000으로 70주 제한하고 자동 주문하지 않는다', () => {
  const { rerender } = renderSection()
  latest = inputs(1_000_000)
  events = [{ pair: 'A:sell', status: 'filled', at: Date.now() + 1 }]
  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('img', { name: '매수 한도 70주' })).toBeInTheDocument()
  expect(buyButton()).toBeEnabled()
  expect(vi.mocked(orders.executeOrder)).not.toHaveBeenCalled()
})
it('체결 0 취소는 진행 중 매도가 아니므로 매수를 막지 않는다', () => {
  const { rerender } = renderSection()
  latest = inputs(1_000_000)
  events = [{ pair: 'A:sell', status: 'cancelled', at: Date.now() + 1 }]
  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  expect(buyButton()).toBeEnabled()
  expect(screen.queryByText(rebalanceText.buyCancelled)).not.toBeInTheDocument()
})
it('매도가 없으면 바로 열리고, 한도 0이면 매수를 막는다', () => {
  latest = inputs(1_000_000, false)
  const { rerender } = renderSection()
  expect(buyButton()).toBeEnabled()
  latest = inputs(300_000, false)
  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  expect(buyButton()).toBeDisabled()
})
it('다른 매수 확인 중이어도 매도는 막지 않는다', () => {
  latest = { ...inputs(0), holdings: [{ ...inputs(0).holdings[0], sellableQuantity: 100 }] } as never
  sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify({ 'a:01:B:buy': { requestId: 'r', state: 'pending', updatedAt: '' } }))
  events = [{ pair: 'A:sell', status: 'filled', at: Date.now() + 1 }]
  renderSection()
  expect(screen.getByText(rebalanceText.otherBuyChecking)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'B 주문 결과 확인 필요' })).not.toBeDisabled()
  expect(screen.getByRole('button', { name: 'A 매매' })).not.toBeDisabled()
  expect(vi.mocked(orders.executeOrder)).not.toHaveBeenCalled()
})
