// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
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
const inputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000 }],
  cashAvailable: 300_000, cashSettled: 300_000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70_000 }, priceFailed: [], hasPortfolio: true,
}
let saveError = false

beforeEach(() => {
  saveError = false
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs, isLoading: false, isFetching: false } as never)
  vi.mocked(keep.useSavedKeepAmount).mockImplementation(() => ({
    keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: saveError, saveKeepAmount: vi.fn(),
  }))
})
afterEach(cleanup)

const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RebalanceSection /></QueryClientProvider>)

it('저장 실패 시 계산을 멈추고 입력 오류를 유지하며, 재저장 성공 시 표는 그대로 돌아온다', () => {
  const { rerender } = show()
  const row = () => screen.getByText('삼성전자').closest('tr')!
  expect(within(row()).getAllByRole('cell')[6]).toHaveTextContent('4')

  saveError = true
  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  expect(screen.getByRole('status', { name: rebalanceText.keepSaveBlocked })).toBeInTheDocument()
  expect(screen.getByText(rebalanceText.keepAmountError)).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()

  saveError = false
  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  expect(screen.queryByRole('status', { name: rebalanceText.keepSaveBlocked })).not.toBeInTheDocument()
  expect(within(row()).getAllByRole('cell')[6]).toHaveTextContent('4')
})
