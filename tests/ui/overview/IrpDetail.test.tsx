import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses } from '../../../src/app/kis/risk-class-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { balance, summary } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))
beforeEach(() => { vi.mocked(getRiskClasses).mockResolvedValue({}) })
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const content = (open: boolean) => <QueryClientProvider client={client}>{open && <IrpDetail accountId="a" />}</QueryClientProvider>
  return { ...render(content(true)), content }
}
it('조회 중에는 로딩 상태를 표시한다', () => {
  vi.mocked(getStockBalance).mockReturnValue(new Promise(() => {}))
  show()
  expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')
})
it('조회 성공 시 합계와 원화 형식의 종목 정보를 표시한다', async () => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  show()
  expect(await screen.findByText('삼성전자')).toBeInTheDocument()
  expect(screen.getByText('13,000원')).toBeInTheDocument()
  expect(screen.getAllByText('1,000원')).toHaveLength(2)
  expect(screen.getByText('12,000원')).toBeInTheDocument()
})
it('보유 종목이 없으면 빈 상태를 표시한다', async () => {
  vi.mocked(getStockBalance).mockResolvedValue({ summary, holdings: [] })
  show()
  expect(await screen.findByText('보유 종목이 없습니다')).toBeInTheDocument()
})
it('safe 종목을 제외한 위험자산 비중을 합계에 표시한다', async () => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  vi.mocked(getRiskClasses).mockResolvedValue({ '069500': 'safe' })
  show()
  expect(await screen.findByText('위험자산 비중 0.00% (예수금 포함)')).toBeInTheDocument()
})
it.each([502, 404, 503])('HTTP %s 오류이면 조회 불가 안내를 표시한다', async status => {
  vi.mocked(getStockBalance).mockRejectedValue({ response: { status } })
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('IRP 계좌를 조회할 수 없습니다')
})
it('상세를 닫으면 사라지고 다시 열면 잔고를 표시한다', async () => {
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  const view = show()
  expect(await screen.findByRole('region', { name: '잔고 상세' })).toBeInTheDocument()
  view.rerender(view.content(false))
  expect(screen.queryByRole('region', { name: '잔고 상세' })).not.toBeInTheDocument()
  view.rerender(view.content(true))
  expect(await screen.findByText('삼성전자')).toBeInTheDocument()
})
it('화면이 md 이상이면 구분선이 있는 표로 전환하고 모바일이면 카드로 표시한다', async () => {
  const resize = new Set<(event: MediaQueryListEvent) => void>()
  vi.stubGlobal('matchMedia', () => ({ matches: true,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => resize.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => resize.delete(listener),
  }))
  vi.mocked(getStockBalance).mockResolvedValue(balance)
  const view = show()
  const table = await screen.findByRole('table')
  expect(table.querySelector('tbody')).toHaveClass('divide-y', 'divide-stone-100')
  expect(screen.getByRole('columnheader', { name: '비중' })).toHaveClass('text-right')
  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'))
  const columns = table.querySelectorAll('thead th').length
  expect(columns).toBe(7)
  expect(rows.every((row) => row.cells.length === columns)).toBe(true)
  expect(rows.at(-1)?.cells[5]).toHaveClass('pr-4', 'text-right')
  act(() => resize.forEach(listener => listener({ matches: false } as MediaQueryListEvent)))
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  view.unmount()
  expect(resize.size).toBe(0)
})
