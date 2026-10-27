import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as marketHook from '../../../../src/app/market/useMarketStatus'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'

vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/app/market/useMarketStatus')
vi.mock('../../../../src/ui/operations/rebalance/useSavedKeepAmount', () => ({
  useSavedKeepAmount: () => ({ keepAmount: 0, isLoading: false, isLoadError: false, isSaving: false, isError: false, saveKeepAmount: vi.fn() }),
}))

const mockOption = {
  accountId: 'acc-1', productCode: '01' as const, accountNumber: '12345678',
  alias: '내ISA', portfolioId: 'pf-1', portfolioName: '성장형',
}
const mockInputs = {
  holdings: [{ code: '005930', name: '삼성전자', quantity: 10, evaluationAmount: 700000 }],
  cash: 300000, cashSettled: 300000,
  targets: [{ kind: 'stock' as const, code: '005930', name: '삼성전자', weightBps: 10000 }],
  prices: { '005930': 70000 },
}

beforeEach(() => {
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([mockOption])
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: mockInputs, isLoading: false, isFetching: false, isError: false, dataUpdatedAt: 1 } as any)
})
afterEach(cleanup)

function renderSection() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><RebalanceSection /></QueryClientProvider>)
}

describe('RebalanceSection 장 상태 연동', () => {
  it('장 중이면 매매 버튼이 활성화된다', () => {
    vi.mocked(marketHook.useMarketStatus).mockReturnValue({ data: { open: true, reason: 'open', nextOpenAt: '2026-10-28T00:00:00.000Z' } } as any)
    renderSection()
    const btn = screen.getByRole('button', { name: '삼성전자 매매' })
    expect(btn).not.toBeDisabled()
    expect(screen.queryByRole('status', { name: /장 마감/ })).not.toBeInTheDocument()
  })

  it('마감·주말·휴장일이면 안내가 보이고 매매 버튼이 비활성화된다', () => {
    vi.mocked(marketHook.useMarketStatus).mockReturnValue({ data: { open: false, reason: 'weekend', nextOpenAt: '2026-10-26T00:00:00.000Z' } } as any)
    renderSection()
    const notice = screen.getByRole('status', { name: /주말/ })
    expect(notice).toHaveAccessibleName(/주말/)
    expect(notice).toHaveAccessibleName(/2026\.10\.26 09:00/)
    expect(screen.getByText('마감')).toBeInTheDocument()
    expect(screen.queryByText(/주말/)).not.toBeInTheDocument()
    const btn = screen.getByRole('button', { name: '삼성전자 매매' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-disabled', 'true')
    expect(btn).toHaveAttribute('aria-describedby', 'market-status-notice')
  })

  it('장 상태 조회 실패 시 안전하게 비활성화하고 오류 안내를 보인다', () => {
    vi.mocked(marketHook.useMarketStatus).mockReturnValue({ isError: true } as any)
    renderSection()
    expect(screen.getByRole('status', { name: '장 상태를 확인할 수 없습니다' })).toBeInTheDocument()
    expect(screen.getByText('확인')).toBeInTheDocument()
    expect(screen.queryByText('장 상태를 확인할 수 없습니다')).not.toBeInTheDocument()
    const btn = screen.getByRole('button', { name: '삼성전자 매매' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-disabled', 'true')
  })
})
