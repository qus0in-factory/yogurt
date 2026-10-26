import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import type { Account } from '../../../../src/domain/accounts/account'
import type { PortfolioAssignment } from '../../../../src/domain/portfolio/assignment'
import type { Portfolio } from '../../../../src/domain/portfolio/portfolio'

export const apiBase = `${window.location.origin}/api`
export const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

export const samplePortfolios: Portfolio[] = [
  {
    id: 'p-1',
    name: '배당 성장형',
    createdAt: '2026-10-26T00:00:00Z',
    updatedAt: '2026-10-26T00:00:00Z',
    items: [
      { kind: 'security', stockCode: '360750', stockName: 'TIGER 미국S&P500', targetWeightBps: 5000 },
      { kind: 'security', stockCode: '133690', stockName: 'TIGER 미국나스닥100', targetWeightBps: 3000 },
      { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 2000 },
    ],
  },
  {
    id: 'p-2',
    name: '안정 현금형',
    createdAt: '2026-10-26T00:00:00Z',
    updatedAt: '2026-10-26T00:00:00Z',
    items: [
      { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 10000 },
    ],
  },
]

export const sampleAccounts: Account[] = [
  {
    id: 'acc-1',
    alias: '주계좌',
    owner: '홍길동',
    accountNumber: '12345678',
    products: ['01', '22'],
    productPlans: {},
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'acc-2',
    alias: '퇴직계좌',
    owner: '김철수',
    accountNumber: '87654321',
    products: ['29'],
    productPlans: {},
    createdAt: '2026-10-02T00:00:00Z',
  },
]

export const sampleAssignments: PortfolioAssignment[] = [
  { accountId: 'acc-1', productCode: '01', portfolioId: 'p-1' },
]

export function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}
