import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { isaText } from '../../../src/ui/glossary/isa'
import { IsaTermSection } from '../../../src/ui/overview/IsaTermSection'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), setProductPlan: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
const listAccounts = vi.mocked(client.listAccounts)

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks() })
async function show(startDate: string, today: string) {
  vi.spyOn(Date, 'now').mockReturnValue(new Date(`${today}T03:00:00+09:00`).getTime())
  listAccounts.mockResolvedValue([{
    id: 'a1', alias: 'ISA', owner: '홍길동', accountNumber: '12345678', products: ['01'],
    productPlans: { '01': { startDate, minTargetAmountWon: null, maxTargetAmountWon: null } },
    createdAt: '2026-01-01T00:00:00.000Z',
  }])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><IsaTermSection accountId="a1" /></QueryClientProvider>)
  return screen.findByTestId('isa-dday')
}

it.each([
  ['2026-01-01', '2027-01-01', 'D-731', 'bg-primary-100', 'active'],
  ['2024-01-01', '2026-12-01', 'D-31', 'bg-amber-100', 'expiringSoon'],
  ['2020-01-01', '2026-01-01', isaText.expired, 'bg-red-100', 'expired'],
] as const)('%s 시작, %s 기준이면 %s 칩을 표시한다', async (startDate, today, label, tone, status) => {
  const chip = await show(startDate, today)
  expect(chip).toHaveTextContent(label)
  expect(chip).toHaveClass(tone)
  expect(chip.dataset.status).toBe(status)
})
