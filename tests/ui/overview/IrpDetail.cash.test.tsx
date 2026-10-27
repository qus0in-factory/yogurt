import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses } from '../../../src/app/kis/risk-class-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))
beforeEach(() => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  vi.mocked(getRiskClasses).mockResolvedValue({})
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
}
function wide() {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
it('표 맨 아래에 현금 행을 구분선과 배경으로 표시한다', async () => {
  wide()
  show()
  const row = (await screen.findByText('현금/예수금/RP')).closest('tr')!
  expect(row).toHaveClass('border-t-2', 'border-stone-200', 'bg-stone-50')
  expect(within(row).getByText('1,000원')).toBeInTheDocument()
  expect(within(row).getByText('7.69%')).toBeInTheDocument()
  expect(within(row).queryByRole('button')).not.toBeInTheDocument()
  expect(row).not.toHaveTextContent('069500')
})
it('모바일 카드 목록 맨 아래에도 현금 카드를 표시한다', async () => {
  show()
  await screen.findByText('삼성전자')
  fireEvent.click(screen.getByRole('button', { name: '다음 보유 항목' }))
  const cash = screen.getByText('현금/예수금/RP').closest('li')!
  expect(cash).toHaveClass('border-t-2', 'bg-stone-50')
  expect(within(cash).getByText('1,000원')).toBeInTheDocument()
  expect(within(cash).getByText('7.69%')).toBeInTheDocument()
  expect(within(cash).queryByRole('button')).not.toBeInTheDocument()
})
it('D+2 예수금을 현금 행·비중에 쓰고 D+0 출금 가능을 보조 표기한다', async () => {
  wide()
  vi.mocked(getStockBalance).mockResolvedValue({ ...balance, summary: { ...balance.summary, cash: 1000, cashD2: 5000 } })
  show()
  const row = (await screen.findByText('현금/예수금/RP')).closest('tr')!
  expect(row).toHaveTextContent('5,000원')
  expect(row).toHaveTextContent('출금 가능(D+0) 1,000원')
  expect(within(row).getByText('29.41%')).toBeInTheDocument()
  expect(screen.getByText('예수금(D+2)')).toBeInTheDocument()
  expect(screen.getByText('위험자산 비중 70.59% (예수금 포함)')).toBeInTheDocument()
})

it('예수금이 0이어도 현금 행을 0원·0.00%로 표시한다', async () => {
  wide()
  vi.mocked(getStockBalance).mockResolvedValue({ ...balance, summary: { ...balance.summary, cash: 0 } })
  show()
  const row = (await screen.findByText('현금/예수금/RP')).closest('tr')!
  expect(within(row).getByText('0원')).toBeInTheDocument()
  expect(within(row).getByText('0.00%')).toBeInTheDocument()
})
