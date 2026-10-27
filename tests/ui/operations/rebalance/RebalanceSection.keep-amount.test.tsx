// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import * as keep from '../../../../src/ui/operations/rebalance/useSavedKeepAmount'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount')

const option = (accountId: string) => ({ accountId, productCode: '01' as const, accountNumber: accountId, alias: accountId, portfolioId: 'p', portfolioName: '성장' })
const inputs = (evaluation: number, cash: number) => ({
  holdings: [{ code: '005930', name: '삼성전자', quantity: 1, evaluationAmount: evaluation }],
  cashAvailable: cash, cashSettled: cash,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': evaluation },
})

beforeEach(() => {
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option('a'), option('b')])
  vi.mocked(hooks.useRebalanceInputs).mockImplementation((target) => ({
    data: target?.accountId === 'b' ? inputs(2_000_000, 1_000_000) : inputs(1_000_000, 500_000),
    isLoading: false,
  } as never))
  vi.mocked(keep.useSavedKeepAmount).mockImplementation((accountId) => ({
    keepAmount: accountId === 'b' ? 200_000 : 100_000,
    isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn(),
  }))
})
afterEach(cleanup)

it('상품별 저장값을 보여 주고, 저장 전 draft를 계산에 쓰지 않는다', () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
  const input = screen.getByLabelText(rebalanceText.keepAmount)
  expect(input).toHaveValue(100_000)
  fireEvent.change(input, { target: { value: '150000' } })
  expect(screen.getByText('1,400,000원')).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText(rebalanceText.accountSelect), { target: { value: 'b:01' } })
  expect(screen.getByLabelText(rebalanceText.keepAmount)).toHaveValue(200_000)
  expect(screen.queryByDisplayValue('150000')).not.toBeInTheDocument()
  expect(screen.getByText('2,800,000원')).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText(rebalanceText.accountSelect), { target: { value: 'a:01' } })
  expect(screen.getByLabelText(rebalanceText.keepAmount)).toHaveValue(100_000)
})
