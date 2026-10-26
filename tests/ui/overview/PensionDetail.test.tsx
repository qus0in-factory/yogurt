import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getAccountAssets, getProductBalance } from '../../../src/app/kis/account-assets-client'
import { spacing, typeScale } from '../../../src/ui/styles/type-scale'
import { PensionDetail } from '../../../src/ui/overview/PensionDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/account-assets-client', () => ({ getAccountAssets: vi.fn(), getProductBalance: vi.fn() }))
const assets = {
  rows: [
    { index: 0, purchaseAmount: 900, evaluationAmount: 1000, profitLoss: 100, creditLoan: 100, netAssets: 900, weight: 33.33 },
    { index: 1, purchaseAmount: 1800, evaluationAmount: 2000, profitLoss: 200, creditLoan: 200, netAssets: 2000, weight: 66.67 },
    { index: 2, purchaseAmount: 500, evaluationAmount: 500, profitLoss: 0, creditLoan: 200, netAssets: 500, weight: 0 },
    { index: 3, purchaseAmount: 0, evaluationAmount: 0, profitLoss: 0, creditLoan: 0, netAssets: 0, weight: 0 },
    { index: 8, purchaseAmount: 500, evaluationAmount: 500, profitLoss: 0, creditLoan: 0, netAssets: 500, weight: 0 },
    { index: 9, purchaseAmount: 3300, evaluationAmount: 4000, profitLoss: 300, creditLoan: 500, netAssets: 3500, weight: 100 },
  ],
  summary: { totalAssets: 13000, netAssets: 13000, evaluationAmount: 3000, purchaseAmount: 2700, profitLoss: 300,
    loanAmount: 500, deposit: 0, totalDeposit: 3000, cmaEvaluation: 0, foreignEvaluation: 0 },
}
beforeEach(() => {
  vi.mocked(getAccountAssets).mockResolvedValue(assets)
  vi.mocked(getProductBalance).mockResolvedValue(balance)
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><PensionDetail accountId="a" /></QueryClientProvider>)
}
it('대출현황·자산군·예수금·주식을 구역별로 표시한다', async () => {
  show()
  expect(await screen.findByRole('heading', { name: '대출현황' })).toBeInTheDocument()
  const title = screen.getByRole('heading', { name: '잔고 상세' })
  expect(title).toHaveClass(...typeScale.section.split(' '))
  expect(screen.getByRole('region', { name: '잔고 상세' })).toHaveClass('mb-8', ...spacing.section.split(' '))

  const loan = within(screen.getByRole('region', { name: '대출현황' }))
  expect(loan.getByText('대출금액').nextElementSibling).toHaveTextContent('500원')
  expect(loan.getByText('담보비율').nextElementSibling).toHaveTextContent('400.00%')
  expect(loan.getByText('융자비율').nextElementSibling).toHaveTextContent('25.00%')
  expect(loan.getByText('신규 대출 불가')).toBeInTheDocument()
  expect(loan.queryByText('자산군 대출 합계')).not.toBeInTheDocument()

  const fund = within(screen.getByRole('region', { name: '투자자산 현황' }))
  expect(fund.getByRole('heading', { name: '투자자산 현황' })).toBeInTheDocument()
  expect(fund.queryByRole('heading', { name: '펀드' })).not.toBeInTheDocument()
  const fundTable = within(fund.getByRole('table'))
  expect(fundTable.getByText('주식')).toBeInTheDocument()
  expect(fundTable.getByText('펀드')).toBeInTheDocument()
  expect(fundTable.getByText('자산군 3')).toBeInTheDocument()
  expect(fundTable.getByText('현금/예수금')).toBeInTheDocument()
  expect(fundTable.getByText('합계')).toBeInTheDocument()
  expect(fundTable.getByText('25.00%')).toBeInTheDocument()
  expect(fundTable.getByText('50.00%')).toBeInTheDocument()
  expect(fundTable.getAllByTestId('holding-weight')).toHaveLength(5)
  expect(fundTable.getByText('4,000원')).toBeInTheDocument()
  expect(fundTable.queryByText('자산군 4')).not.toBeInTheDocument()

  const holdings = within(screen.getByRole('region', { name: '예수금·주식' }))
  expect(holdings.getByText('삼성전자')).toBeInTheDocument()
  expect(holdings.getByText('현금/예수금/RP')).toBeInTheDocument()
  expect(holdings.queryByRole('button', { name: /위험|안전/ })).not.toBeInTheDocument()
})
it('자산현황 조회가 실패하면 연금저축 안내를 표시한다', async () => {
  vi.mocked(getAccountAssets).mockRejectedValue({ response: { status: 404 } })
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('연금저축 계좌를 조회할 수 없습니다')
})
it('잔고 조회가 실패해도 연금저축 안내를 표시한다', async () => {
  vi.mocked(getProductBalance).mockRejectedValue({ response: { status: 502 } })
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('연금저축 계좌를 조회할 수 없습니다')
})
