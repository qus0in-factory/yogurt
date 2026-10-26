import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getAccountAssets, getProductBalance } from '../../../src/app/kis/account-assets-client'
import { PensionDetail } from '../../../src/ui/overview/PensionDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/account-assets-client', () => ({ getAccountAssets: vi.fn(), getProductBalance: vi.fn() }))
const row = (index: number, amount: number) => ({ index, purchaseAmount: amount, evaluationAmount: amount, profitLoss: 0, creditLoan: 0, netAssets: amount, weight: 0 })
const assets = {
  rows: [row(0, 1000), row(1, 2000), row(9, 3000)],
  summary: { totalAssets: 0, netAssets: 0, evaluationAmount: 3000, purchaseAmount: 0, profitLoss: 0,
    loanAmount: 500, deposit: 0, totalDeposit: 0, cmaEvaluation: 0, foreignEvaluation: 0 },
}
beforeEach(() => {
  vi.mocked(getAccountAssets).mockResolvedValue(assets)
  vi.mocked(getProductBalance).mockResolvedValue(balance)
})
afterEach(() => { cleanup(); vi.clearAllMocks() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><PensionDetail accountId="a" /></QueryClientProvider>)
}
it('펀드 평가금액이 없으면 대출현황 구역을 숨긴다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue({ ...assets, rows: [row(0, 1000), row(2, 2000), row(9, 3000)] })
  show()
  expect(await screen.findByRole('heading', { name: '투자자산 현황' })).toBeInTheDocument()
  expect(screen.queryByRole('region', { name: '대출현황' })).not.toBeInTheDocument()
})
it('펀드가 충분하고 대출이 0이면 대출 없음과 신규 가능을 표시한다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue({
    ...assets,
    rows: [row(0, 1000), row(1, 20_000), row(9, 3000)],
    summary: { ...assets.summary, loanAmount: 0 },
  })
  show()
  const loan = within(await screen.findByRole('region', { name: '대출현황' }))
  expect(loan.getByText('대출 없음')).toBeInTheDocument()
  expect(loan.getByText('신규 대출 가능')).toBeInTheDocument()
})

it('펀드가 부족(가능금액 1만원 미만)하고 대출이 0이면 신규 대출 불가를 표시한다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue({ ...assets, summary: { ...assets.summary, loanAmount: 0 } })
  show()
  const loan = within(await screen.findByRole('region', { name: '대출현황' }))
  expect(loan.getByText('대출 없음')).toBeInTheDocument()
  expect(loan.getByText('신규 대출 불가')).toBeInTheDocument()
})
