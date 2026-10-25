import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { isaText } from '../../../src/ui/glossary/isa'
import { IsaTermSection } from '../../../src/ui/overview/IsaTermSection'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), setProductPlan: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const listAccounts = vi.mocked(client.listAccounts)
const account = (productPlans: Record<string, { startDate: string; minTargetAmountWon: number | null; maxTargetAmountWon: number | null }> = {}) => ({
  id: 'a1', alias: 'ISA', owner: '홍길동', accountNumber: '12345678', products: ['01'],
  productPlans, createdAt: '2026-01-01T00:00:00.000Z',
})
function show() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><IsaTermSection accountId="a1" /></QueryClientProvider>)
}
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks() })

describe('IsaTermSection', () => {
  it('계획 제목과 시작일·만기일·남은 기간·목표금액을 함께 표시한다', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2027-03-01T03:00:00+09:00').getTime())
    listAccounts.mockResolvedValue([account({
      '01': { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null },
    })])
    show()
    expect(screen.getByRole('heading', { name: isaText.term })).toBeInTheDocument()
    expect(await screen.findByText('2024.03.15')).toBeInTheDocument()
    expect(screen.getByText(isaText.maturity)).toBeInTheDocument()
    expect(screen.getByText('2027.03.15')).toBeInTheDocument()
    expect(screen.getAllByText('1,250만원')[0]).toBeInTheDocument()
    expect(screen.getByText('미설정')).toBeInTheDocument()
    const chip = screen.getByTestId('isa-dday')
    expect(chip).toHaveTextContent('D-14')
    expect(chip).toHaveClass('bg-amber-100')
  })

  it('계획이 없으면 EmptyState를 보여주고 입력 버튼으로 모달을 연다', async () => {
    listAccounts.mockResolvedValue([account()])
    show()
    expect(await screen.findByText(isaText.emptyTitle)).toBeInTheDocument()
    expect(screen.getByText(isaText.empty)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: isaText.emptyAction }))
    expect(screen.getByRole('dialog', { name: isaText.addTitle })).toBeInTheDocument()
  })

  it('수정 버튼을 누르면 기존 계획이 채워진 모달이 열린다', async () => {
    listAccounts.mockResolvedValue([account({
      '01': { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: 2_500_000 },
    })])
    show()
    await screen.findByText('2024.03.15')
    fireEvent.click(screen.getByRole('button', { name: isaText.edit }))
    expect(screen.getByLabelText(isaText.startDate)).toHaveValue('2024-03-15')
    expect(screen.getByLabelText(isaText.minTarget)).toHaveValue(1250)
    expect(screen.getByLabelText(isaText.maxTarget)).toHaveValue(250)
  })

  it('닫으면 입력 초안을 버리고 다시 열 때 저장된 값을 보여준다', async () => {
    listAccounts.mockResolvedValue([account({
      '01': { startDate: '2024-03-15', minTargetAmountWon: null, maxTargetAmountWon: null },
    })])
    show()
    await screen.findByText('2024.03.15')
    fireEvent.click(screen.getByRole('button', { name: isaText.edit }))
    fireEvent.change(screen.getByLabelText(isaText.startDate), { target: { value: '2025-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: isaText.cancel }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: isaText.edit }))
    expect(screen.getByLabelText(isaText.startDate)).toHaveValue('2024-03-15')
  })
})
