// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
const inputs = (cash: number) => ({
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000 }],
  cashAvailable: cash, cashSettled: cash,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70_000 }, priceFailed: [], hasPortfolio: true,
})
let latest = inputs(300_000), nextInputs = latest, dataUpdatedAt = 1, savedKeep = 0, keepUpdatedAt = 1
let inputFetching = false, keepFetching = false
const refetch = vi.fn(async () => { inputFetching = true; latest = nextInputs; dataUpdatedAt += 1; return { data: latest } })
const refetchKeepAmount = vi.fn(async () => { keepFetching = true; keepUpdatedAt += 1; return { data: { keepAmount: savedKeep } } })

beforeEach(() => {
  latest = inputs(300_000); nextInputs = latest; dataUpdatedAt = 1; savedKeep = 0; keepUpdatedAt = 1; inputFetching = false; keepFetching = false
  refetch.mockClear(); refetchKeepAmount.mockClear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option])
  vi.mocked(hooks.useRebalanceInputs).mockImplementation(() => ({ data: latest, dataUpdatedAt, refetch, isLoading: false, isFetching: inputFetching, isError: false } as never))
  vi.mocked(keep.useSavedKeepAmount).mockImplementation(() => ({
    keepAmount: savedKeep, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn(),
    savedKeepVersion: 0, keepUpdatedAt, isKeepFetching: keepFetching, refetchKeepAmount,
  }))
})
afterEach(cleanup)

const renderSection = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RebalanceSection /></QueryClientProvider>)
const orderCell = () => within(screen.getByText('삼성전자').closest('tr')!).getAllByRole('cell')[6]

it('다시 계산은 캐시가 아니라 새로 조회한 입력으로 표를 갱신하고 중복 클릭을 무시한다', async () => {
  const { rerender } = renderSection()
  expect(orderCell()).toHaveTextContent('4')

  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  expect(orderCell()).toHaveTextContent('4')

  nextInputs = inputs(500_000)
  fireEvent.click(screen.getByRole('button', { name: rebalanceText.recalcPlan }))
  expect(inputFetching).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: rebalanceText.recalcPlan }))
  expect(refetch).toHaveBeenCalledTimes(1)

  inputFetching = false; keepFetching = false
  rerender(<QueryClientProvider client={new QueryClient()}><RebalanceSection /></QueryClientProvider>)
  await waitFor(() => expect(orderCell()).toHaveTextContent('7'))
})
