import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><IsaTermSection accountId="a1" /></QueryClientProvider>)
}

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks() })

describe('IsaTermSection layout', () => {
  it('시작일·만기일·남은 기간을 데스크톱 기준 3열 그리드로 배치한다', async () => {
    listAccounts.mockResolvedValue([account({
      '01': { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: 20_000_000 },
    })])
    show()
    await screen.findByText('2024.03.15')
    const grid = screen.getByTestId('isa-term-grid').querySelector('dl')
    expect(grid).toHaveClass('md:grid-cols-3', 'grid-cols-1')
    expect(grid?.children).toHaveLength(3)
  })

  it('최소 목표금액과 최대 목표금액은 같은 행 컨테이너에 함께 렌더링되고 3열 묶음과 분리된다', async () => {
    listAccounts.mockResolvedValue([account({
      '01': { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: 20_000_000 },
    })])
    show()
    await screen.findByText('1,250만원')
    const termGrid = screen.getByTestId('isa-term-grid').querySelector('dl')
    const amountGrid = screen.getByTestId('isa-amount-summary').querySelector('dl')
    expect(amountGrid).not.toBe(termGrid)
    expect(amountGrid).toHaveClass('md:grid-cols-2', 'grid-cols-1')

    const minRow = screen.getByText(isaText.minTarget).closest('div')
    const maxRow = screen.getByText(isaText.maxTarget).closest('div')
    expect(minRow).toBeInTheDocument()
    expect(maxRow).toBeInTheDocument()
    expect(minRow?.parentElement).toBe(amountGrid)
    expect(maxRow?.parentElement).toBe(amountGrid)
  })

  it('목표금액 값이 없을 때 미설정 문구를 각 줄에 표시한다', async () => {
    listAccounts.mockResolvedValue([account({
      '01': { startDate: '2024-03-15', minTargetAmountWon: null, maxTargetAmountWon: null },
    })])
    show()
    await screen.findByText('2024.03.15')
    const unsetItems = screen.getAllByText(isaText.unset)
    expect(unsetItems).toHaveLength(2)
  })
})
