import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import * as clientModule from '../../../src/app/accounts/client'
import * as useIsaProgressModule from '../../../src/ui/overview/useIsaProgress'
import { IsaProgressSection } from '../../../src/ui/overview/IsaProgressSection'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('IsaProgressSection closing integration', () => {
  const plan = { startDate: '2023-10-15', minTargetAmountWon: 36_000_000, maxTargetAmountWon: 72_000_000 }
  // 2023-10-15 startDate -> 3 years -> maturity is 2026-10-15 (month: 2026-10)

  it('만기 월에 직전 월 마감 값이 있으면 점과 날짜·금액을 표시한다', async () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 25_000_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    vi.spyOn(clientModule, 'getIsaLastClose').mockResolvedValueOnce({
      date: '2026-09-30', totalAssetsWon: 25_200_000,
    })
    const { container } = render(
      <IsaProgressSection accountId="a1" plan={plan} today="2026-10-10" />,
      { wrapper: createWrapper() }
    )
    expect(await screen.findByText('2520만')).toBeInTheDocument()
    expect(screen.getByText('2026-09-30')).toBeInTheDocument()
    expect(container.querySelector('circle[data-testid="last-close-dot"]')).toBeInTheDocument()
  })

  it('만기 월에 마감 기록이 없으면 마감 기록 대기 문구를 표시한다', async () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 25_000_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    vi.spyOn(clientModule, 'getIsaLastClose').mockResolvedValueOnce(null)
    render(
      <IsaProgressSection accountId="a1" plan={plan} today="2026-10-10" />,
      { wrapper: createWrapper() }
    )
    expect(await screen.findByTestId('closing-wait')).toHaveTextContent('마감 기록 대기')
  })

  it('만기 월이 아니면 조회 결과가 있어도 기존 현재 점을 유지한다', async () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 25_000_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    vi.spyOn(clientModule, 'getIsaLastClose').mockResolvedValueOnce({
      date: '2026-08-31', totalAssetsWon: 24_000_000,
    })
    const { container } = render(
      <IsaProgressSection accountId="a1" plan={plan} today="2026-09-10" />,
      { wrapper: createWrapper() }
    )
    expect(container.querySelector('circle[data-testid="current-dot"]')).toBeInTheDocument()
    expect(screen.queryByText('2026-08-31')).not.toBeInTheDocument()
  })
})
