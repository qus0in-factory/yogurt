// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import * as keep from '../../../../src/ui/operations/rebalance/useSavedKeepAmount'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/accounts/useAccounts', () => ({ useAccounts: () => ({ data: [] }) }))
vi.mock('../../../../src/app/market/useMarketStatus', () => ({ useMarketStatus: () => ({ data: { open: true }, isError: false }) }))
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount')

const option = { accountId: 'a', productCode: '01' as const, accountNumber: 'a', alias: 'a', portfolioId: 'p', portfolioName: '성장' }
const inputs = (evaluation: number, cash: number) => ({
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: evaluation }],
  cashAvailable: cash, cashSettled: cash,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70_000 }, priceFailed: [], hasPortfolio: true,
})

beforeEach(() => {
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs(700_000, 300_000), isLoading: false } as never)
})
afterEach(cleanup)

const show = (state: { keepAmount: number; isLoading: boolean; isLoadError: boolean }) => {
  vi.mocked(keep.useSavedKeepAmount).mockReturnValue({
    ...state, isSaving: false, isError: false, saveKeepAmount: vi.fn(),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><RebalanceSection /></QueryClientProvider>)
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.queryByText('4')).not.toBeInTheDocument()
}

it('남길 금액 조회 로딩 중에는 계산하지 않는다', () => {
  show({ keepAmount: 0, isLoading: true, isLoadError: false })
  expect(screen.getByRole('status', { name: rebalanceText.keepLoadBlocked })).toBeInTheDocument()
})

it('남길 금액 조회 실패 시 안내하고 계산하지 않는다', () => {
  show({ keepAmount: 0, isLoading: false, isLoadError: true })
  expect(screen.getByRole('status', { name: rebalanceText.keepLoadBlocked })).toBeInTheDocument()
})

it('남길 금액이 전체 금액 이상이면 계산하지 않는다', () => {
  show({ keepAmount: 1_000_000, isLoading: false, isLoadError: false })
  expect(screen.getByRole('status', { name: rebalanceText.keepNotBelowTotal })).toBeInTheDocument()
  expect(screen.getByText('전체')).toBeInTheDocument()
  expect(screen.queryByText(/남길 금액이 계좌 전체 금액보다 커서/)).not.toBeInTheDocument()
})
