import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses } from '../../../src/app/kis/risk-class-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { summary } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))

const noHoldings = { summary: { ...summary, cash: 1000 }, holdings: [] }
function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  vi.stubGlobal('matchMedia', () => ({ matches: width >= 769, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
}
beforeEach(() => { vi.mocked(getStockBalance).mockResolvedValue(noHoldings); vi.mocked(getRiskClasses).mockResolvedValue({}) })
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })

it('B: 375px 종목 0개여도 예수금 카드가 캐러셀 페이지로 도달한다', async () => {
  setViewport(375)
  show()
  expect(await screen.findByText('보유 종목이 없습니다')).toBeInTheDocument()
  expect(screen.getByText('1 / 2')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '다음 보유 항목' }))
  expect(screen.getByText('현금/예수금/RP')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /나머지|접힘/ })).not.toBeInTheDocument()
})

it('C: 769px 종목 0개여도 표와 예수금 행이 보인다', async () => {
  setViewport(769)
  show()
  expect(await screen.findByText('보유 종목이 없습니다')).toBeInTheDocument()
  const table = screen.getByRole('table')
  expect(table.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(screen.getByText('현금/예수금/RP')).toBeInTheDocument()
  expect(screen.queryByLabelText('보유 항목 목록')).not.toBeInTheDocument()
})
