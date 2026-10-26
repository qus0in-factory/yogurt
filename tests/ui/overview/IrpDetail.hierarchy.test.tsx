import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses } from '../../../src/app/kis/risk-class-client'
import { spacing, typeScale } from '../../../src/ui/styles/type-scale'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))
beforeEach(() => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  vi.mocked(getRiskClasses).mockResolvedValue({})
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
it('잔고 상세 > 보유 종목 > 표 헤더 순서로 계층을 적용한다', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
  const title = await screen.findByRole('heading', { name: '잔고 상세' })
  expect(title).toHaveClass(...typeScale.section.split(' '))
  const region = screen.getByRole('region', { name: '잔고 상세' })
  expect(region).toHaveClass('mb-8', ...spacing.section.split(' '))
  const holdings = screen.getByRole('heading', { name: '보유 종목' })
  expect(holdings).toHaveClass('mb-3', ...typeScale.title.split(' '))
  expect(holdings.closest('table')).toBeNull()
  const header = screen.getByRole('columnheader', { name: '종목명' })
  expect(header).toHaveClass(...typeScale.label.split(' '))
  expect(screen.getByText('13,000원').closest('div')?.parentElement).toBe(region)
})
