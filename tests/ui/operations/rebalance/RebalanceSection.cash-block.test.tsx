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

beforeEach(() => {
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([{ accountId: 'a', productCode: '01', accountNumber: 'a', alias: 'a', portfolioId: 'p', portfolioName: '성장' }])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: {
    holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000 }],
    cashAvailable: 300_000, cashSettled: null, cash: 300_000,
    targets: [{ kind: 'stock', code: '005930', name: '삼성전자', weightBps: 10000 }],
    prices: { '005930': 70_000 }, priceFailed: [], hasPortfolio: true,
  }, isLoading: false, isFetching: false } as never)
  vi.mocked(keep.useSavedKeepAmount).mockReturnValue({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() })
})
afterEach(cleanup)

it('D+2 예수금이 null이면 계산을 차단하고 D+0으로 대체하지 않는다', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><RebalanceSection /></QueryClientProvider>)
  expect(screen.getByRole('status', { name: rebalanceText.cashBlocked })).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '삼성전자 매매' })).not.toBeInTheDocument()
})
