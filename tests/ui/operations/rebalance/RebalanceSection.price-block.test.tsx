// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as client from '../../../../src/app/trading/orders-client'
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
const inputs = (holding: Record<string, unknown>, priceFailed: string[] = []) => ({
  holdings: [holding], cashAvailable: 500_000, cashSettled: 500_000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70_000 }, priceFailed, hasPortfolio: true,
})

beforeEach(() => {
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option])
  vi.mocked(keep.useSavedKeepAmount).mockReturnValue({
    keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn(),
  })
})
afterEach(cleanup)

const show = (data: ReturnType<typeof inputs>) => {
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data, isLoading: false } as never)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><RebalanceSection /></QueryClientProvider>)
  expect(screen.getByRole('status', { name: rebalanceText.priceBlocked })).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '삼성전자 매매' })).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(vi.mocked(client.executeOrder)).not.toHaveBeenCalled()
}

it('priceFailed가 있으면 표·주문 버튼·확인 창 없이 차단한다', () => {
  show(inputs({ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000 }, ['005930']))
})

it('보유 종목 currentPrice가 0이어도 차단한다', () => {
  show(inputs({ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000, currentPrice: 0 }))
})
