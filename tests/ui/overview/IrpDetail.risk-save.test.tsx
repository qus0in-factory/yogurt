import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses, setRiskClass } from '../../../src/app/kis/risk-class-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { balance } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))
beforeEach(() => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  vi.mocked(getRiskClasses).mockResolvedValue({}).mockResolvedValueOnce({}).mockResolvedValueOnce({ '069500': 'safe' })
})
afterEach(() => { cleanup(); vi.clearAllMocks() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
}
it('저장 중에는 같은 종목을 다시 토글할 수 없고 완료 후 비중을 갱신한다', async () => {
  let resolve!: (value: { stockCode: string; riskClass: 'risk' | 'safe' }) => void
  vi.mocked(setRiskClass).mockReturnValue(new Promise((done) => { resolve = done }))
  show()
  const button = await screen.findByRole('button', { name: '위험' })
  fireEvent.click(button)
  await waitFor(() => expect(setRiskClass).toHaveBeenCalledWith('a', '29', '069500', 'safe'))
  expect(button).toBeDisabled()
  fireEvent.click(button)
  expect(setRiskClass).toHaveBeenCalledOnce()
  resolve({ stockCode: '069500', riskClass: 'safe' })
  expect(await screen.findByText('위험자산 비중 0.00% (예수금 포함)')).toBeInTheDocument()
  expect(getRiskClasses).toHaveBeenCalledTimes(2)
})
