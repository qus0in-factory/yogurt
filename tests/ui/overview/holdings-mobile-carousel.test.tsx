import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getStockBalance } from '../../../src/app/kis/stock-balance-client'
import { getRiskClasses } from '../../../src/app/kis/risk-class-client'
import { IrpDetail } from '../../../src/ui/overview/IrpDetail'
import { holding, summary } from './fixtures'

vi.mock('../../../src/app/kis/stock-balance-client', () => ({ getStockBalance: vi.fn() }))
vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))

const holdings = Array.from({ length: 10 }, (_, index) => ({ ...holding, code: String(100000 + index), name: `종목${index + 1}` }))
const risky = { summary: { ...summary, cash: 0 }, holdings }
const next = () => screen.getByRole('button', { name: '다음 보유 항목' })

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
  vi.stubGlobal('matchMedia', () => ({ matches: width >= 769,
    addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><IrpDetail accountId="a" /></QueryClientProvider>)
}
beforeEach(() => {
  vi.mocked(getStockBalance).mockResolvedValue(risky)
  vi.mocked(getRiskClasses).mockResolvedValue({})
})
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals() })

it('375px에서는 보유 항목 캐러셀이 모든 페이지에 도달하고 접기 버튼이 없다', async () => {
  setViewport(375)
  show()
  const warning = await screen.findByText('위험자산 70% 초과')
  expect(screen.getByText('종목1')).toBeInTheDocument()
  expect(screen.queryByText('종목2')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('1 / 11')
  expect(screen.queryByRole('button', { name: /나머지|접힘/ })).not.toBeInTheDocument()
  expect(warning.compareDocumentPosition(screen.getByLabelText('보유 항목 목록')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  for (let page = 0; page < 10; page++) fireEvent.click(next())
  expect(screen.getByText('현금/예수금/RP')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('11 / 11')
})

it('키보드 좌우 키로 이전·다음 보유 항목을 넘긴다', async () => {
  setViewport(375)
  show()
  const list = await screen.findByLabelText('보유 항목 목록')
  fireEvent.keyDown(list, { key: 'ArrowRight' })
  expect(screen.getByText('종목2')).toBeInTheDocument()
  fireEvent.keyDown(list, { key: 'ArrowLeft' })
  expect(screen.getByText('종목1')).toBeInTheDocument()
})

it('768px에서는 캐러셀 한 페이지 한 항목이고 769px 이상은 기존 표를 유지한다', async () => {
  setViewport(768)
  show()
  expect(await screen.findByText('종목1')).toBeInTheDocument()
  expect(screen.queryByText('종목2')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('1 / 11')
  expect(screen.queryByRole('button', { name: /나머지|접힘/ })).not.toBeInTheDocument()
  fireEvent.click(next())
  expect(screen.getByText('종목2')).toBeInTheDocument()
  cleanup()
  vi.clearAllMocks()
  setViewport(769)
  show()
  const table = await screen.findByRole('table')
  expect(table.querySelectorAll('thead th')).toHaveLength(7)
  expect(table.querySelectorAll('tbody tr')).toHaveLength(11)
  expect(screen.getByText('종목10')).toBeInTheDocument()
  expect(screen.queryByLabelText('보유 항목 목록')).not.toBeInTheDocument()
})
