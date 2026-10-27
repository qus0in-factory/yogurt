// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'

vi.mock('../../../../src/app/trading/orders-client')
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({
  useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }),
}))

const option = { accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678', alias: 'ISA', portfolioId: 'p', portfolioName: '성장' }
const inputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700_000 }],
  cashAvailable: 300_000, cashSettled: 500_000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70_000 },
}

beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([option])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs, isLoading: false } as never)
})
afterEach(() => { cleanup(); sessionStorage.clear() })

it('전체 금액과 현재 비중의 분모를 D+2로 쓰고 두 예수금 줄을 표시한다', () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)

  expect(screen.getAllByText('1,200,000원').length).toBeGreaterThanOrEqual(1)
  expect(screen.getByText('출금 가능(D+0)')).toBeInTheDocument()
  expect(screen.getByText('예수금(D+2)')).toBeInTheDocument()
  expect(screen.getByText('300,000원')).toBeInTheDocument()
  expect(screen.getAllByText('500,000원').length).toBeGreaterThanOrEqual(1)
  expect(screen.getByText('58.33%')).toBeInTheDocument()
})
