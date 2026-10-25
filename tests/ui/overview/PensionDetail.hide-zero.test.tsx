import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getAccountAssets, getProductBalance } from '../../../src/app/kis/account-assets-client'
import { PensionDetail } from '../../../src/ui/overview/PensionDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/account-assets-client', () => ({ getAccountAssets: vi.fn(), getProductBalance: vi.fn() }))
vi.mock('../../../src/ui/accounts/useAccounts', () => ({ useAccounts: () => ({ data: [] }) }))

const row = (index: number, evaluationAmount: number, weight = 1) => ({
  index, purchaseAmount: 0, evaluationAmount, profitLoss: 0, creditLoan: 0, netAssets: evaluationAmount, weight,
})
const assets = (stock: number, cash: number) => ({
  rows: [row(0, stock), row(1, 2000), row(8, cash), row(9, stock + cash + 2000, 100)],
  summary: { totalAssets: stock + cash + 2000, netAssets: 0, evaluationAmount: 2000, purchaseAmount: 0, profitLoss: 0,
    loanAmount: 0, deposit: cash, totalDeposit: 0, cmaEvaluation: 0, foreignEvaluation: 0 },
})

beforeEach(() => {
  vi.mocked(getProductBalance).mockResolvedValue(balance)
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })

function show(productCode = '22') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><PensionDetail accountId="a" productCode={productCode} /></QueryClientProvider>)
}

async function regions() {
  const asset = within(await screen.findByRole('region', { name: '투자자산 현황' }))
  const holdings = screen.queryByRole('region', { name: '예수금·주식' })
  return { asset, holdings: holdings ? within(holdings) : null }
}

it('주식이 0이고 예수금이 있으면 주식 행과 보유 종목만 숨긴다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue(assets(0, 500))
  show()
  const { asset, holdings } = await regions()
  expect(asset.queryByText('주식')).not.toBeInTheDocument()
  expect(asset.getByText('현금/예수금')).toBeInTheDocument()
  expect(holdings).not.toBeNull()
  expect(holdings?.queryByText('삼성전자')).not.toBeInTheDocument()
  expect(holdings?.getByText('현금/예수금/RP')).toBeInTheDocument()
  expect(holdings?.getByText('예수금')).toBeInTheDocument()
})

it('예수금이 0이고 주식이 있으면 예수금 표시만 숨긴다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue(assets(1000, 0))
  vi.mocked(getProductBalance).mockResolvedValue({ ...balance, summary: { ...balance.summary, cash: 0 } })
  show()
  const { asset, holdings } = await regions()
  expect(asset.getByText('주식')).toBeInTheDocument()
  expect(asset.queryByText('현금/예수금')).not.toBeInTheDocument()
  expect(holdings?.getByText('삼성전자')).toBeInTheDocument()
  expect(holdings?.queryByText('현금/예수금/RP')).not.toBeInTheDocument()
  expect(holdings?.queryByText('예수금')).not.toBeInTheDocument()
})

it('주식과 예수금이 모두 0이면 두 섹션을 모두 숨기고 펀드는 남긴다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue(assets(0, 0))
  show()
  const { asset, holdings } = await regions()
  expect(asset.queryByText('주식')).not.toBeInTheDocument()
  expect(asset.queryByText('현금/예수금')).not.toBeInTheDocument()
  expect(asset.getByText('펀드')).toBeInTheDocument()
  expect(holdings).toBeNull()
})

it('주식과 예수금이 모두 있으면 기존처럼 두 섹션을 보여준다', async () => {
  vi.mocked(getAccountAssets).mockResolvedValue(assets(1000, 500))
  show()
  const { asset, holdings } = await regions()
  expect(asset.getByText('주식')).toBeInTheDocument()
  expect(asset.getByText('현금/예수금')).toBeInTheDocument()
  expect(holdings?.getByText('삼성전자')).toBeInTheDocument()
  expect(holdings?.getByText('현금/예수금/RP')).toBeInTheDocument()
})
