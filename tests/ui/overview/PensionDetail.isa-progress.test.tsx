import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAccountAssets, getProductBalance } from '../../../src/app/kis/account-assets-client'
import { useAccounts } from '../../../src/ui/accounts/useAccounts'
import { PensionDetail } from '../../../src/ui/overview/PensionDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/account-assets-client', () => ({
  getAccountAssets: vi.fn(),
  getProductBalance: vi.fn(),
}))
vi.mock('../../../src/ui/accounts/useAccounts', () => ({
  useAccounts: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(useAccounts).mockReturnValue({
    data: [{ id: 'isa-1', name: 'ISA', products: ['01'], productPlans: { '01': { startDate: '2026-01-01', minTarget: 10_000_000, maxTarget: 20_000_000 } } }],
  } as any)
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })

function show(productCode = '01') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><PensionDetail accountId="isa-1" productCode={productCode} /></QueryClientProvider>)
}

describe('PensionDetail with ISA progress', () => {
  it('balance 조회가 실패해도 ISA 계획 섹션은 표시된다', async () => {
    vi.mocked(getAccountAssets).mockResolvedValue({
      rows: [],
      summary: { totalAssets: 15_000_000, netAssets: 15_000_000, evaluationAmount: 15_000_000, purchaseAmount: 10_000_000, profitLoss: 5_000_000, loanAmount: 0, deposit: 0, totalDeposit: 0, cmaEvaluation: 0, foreignEvaluation: 0 },
    } as any)
    vi.mocked(getProductBalance).mockRejectedValue(new Error('balance failed'))

    show('01')
    expect(await screen.findByRole('region', { name: 'ISA 계획' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'ISA 계획' })).toBeInTheDocument()
  })

  it('다른 상품(22)은 기존대로 조회 실패 시 연금저축 안내를 표시한다', async () => {
    vi.mocked(getAccountAssets).mockRejectedValue(new Error('assets failed'))
    show('22')
    expect(await screen.findByRole('alert')).toHaveTextContent('연금저축 계좌를 조회할 수 없습니다')
  })

  it('ISA는 주식이 0이어도 주식 행과 보유 종목을 그대로 보여준다', async () => {
    const r = (index: number, evaluationAmount: number, weight = 0) => ({
      index, purchaseAmount: evaluationAmount, evaluationAmount, profitLoss: 0, creditLoan: 0, netAssets: evaluationAmount, weight,
    })
    vi.mocked(getAccountAssets).mockResolvedValue({ rows: [r(0, 0, 1), r(1, 2000), r(17, 0, 1), r(18, 2000)], summary: {} } as any)
    vi.mocked(getProductBalance).mockResolvedValue(balance)
    show('01')
    const asset = within(await screen.findByRole('region', { name: '투자자산 현황' }))
    expect(asset.getByText('주식')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '예수금·주식' })).getByText('삼성전자')).toBeInTheDocument()
  })
})
