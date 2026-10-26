import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses, setRiskClass } from '../../../src/app/kis/risk-class-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { balance, holding, summary } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))
beforeEach(() => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  vi.mocked(getRiskClasses).mockResolvedValue({})
})
afterEach(() => { cleanup(); vi.clearAllMocks() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
}
it('위험 구분 조회 중에는 비중을 확정하지 않고 토글을 막는다', async () => {
  let resolve!: (classes: Record<string, 'risk' | 'safe'>) => void
  vi.mocked(getRiskClasses).mockReturnValue(new Promise((done) => { resolve = done }))
  show()
  expect(await screen.findByText('삼성전자')).toBeInTheDocument()
  expect(screen.getByText('위험 구분을 불러오는 중…')).toBeInTheDocument()
  expect(screen.queryByText(/위험자산 비중/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: '위험' })).toBeDisabled()
  resolve({ '069500': 'safe' })
  expect(await screen.findByText('위험자산 비중 0.00% (예수금 포함)')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '안전' })).toBeEnabled()
})
it('위험 구분 조회 실패 시 안내와 재시도를 제공한다', async () => {
  vi.mocked(getRiskClasses).mockRejectedValue(new Error('down'))
  show()
  expect(await screen.findByText('위험 구분을 불러오지 못했습니다')).toBeInTheDocument()
  expect(screen.queryByText(/위험자산 비중/)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
  await waitFor(() => expect(getRiskClasses).toHaveBeenCalledTimes(2))
})
it('빈 종목코드는 위험으로 계산하지만 토글을 숨긴다', async () => {
  vi.mocked(getStockBalance).mockResolvedValue({ summary, holdings: [{ ...holding, code: '' }] })
  show()
  expect(await screen.findByText('삼성전자')).toBeInTheDocument()
  expect(screen.getByText('위험자산 비중 92.31% (예수금 포함)')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /위험|안전/ })).not.toBeInTheDocument()
  expect(setRiskClass).not.toHaveBeenCalled()
})
