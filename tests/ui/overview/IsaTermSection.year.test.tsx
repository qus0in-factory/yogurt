import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { IsaTermSection } from '../../../src/ui/overview/IsaTermSection'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), setProductPlan: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
const listAccounts = vi.mocked(client.listAccounts)

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks() })

async function renderSection(startDate: string, today: string) {
  vi.spyOn(Date, 'now').mockReturnValue(new Date(`${today}T03:00:00+09:00`).getTime())
  listAccounts.mockResolvedValue([{
    id: 'a1', alias: 'ISA', owner: '홍길동', accountNumber: '12345678', products: ['01'],
    productPlans: { '01': { startDate, minTargetAmountWon: null, maxTargetAmountWon: null } },
    createdAt: '2026-01-01T00:00:00.000Z',
  }])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><IsaTermSection accountId="a1" /></QueryClientProvider>)
  await screen.findByTestId('isa-dday')
}

it('진행 중인 ISA는 연차 텍스트를 남은 기간 칩 옆에 표시한다', async () => {
  await renderSection('2026-01-01', '2027-01-01') // k=13 -> 2년차
  const yearEl = screen.getByTestId('isa-year')
  expect(yearEl).toHaveTextContent('2년차')
})

it('시작 전인 ISA는 연차 대신 시작 전 텍스트를 표시한다', async () => {
  await renderSection('2026-05-01', '2026-01-01') // k=0 -> 시작 전
  const yearEl = screen.getByTestId('isa-year')
  expect(yearEl).toHaveTextContent('시작 전')
})

it('만기가 지난 ISA는 연차를 표시하지 않는다', async () => {
  await renderSection('2020-01-01', '2026-01-01') // expired
  expect(screen.queryByTestId('isa-year')).not.toBeInTheDocument()
})
