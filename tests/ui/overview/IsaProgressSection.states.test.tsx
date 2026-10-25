import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { IsaProgressSection } from '../../../src/ui/overview/IsaProgressSection'
import * as useIsaProgressModule from '../../../src/ui/overview/useIsaProgress'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('IsaProgressSection states', () => {
  it('지적 A: 실제 ProductPlan(minTargetAmountWon) 매핑 시 목표 없음 대신 차트가 렌더링된다', () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 15_000_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    render(
      <IsaProgressSection accountId="a1" plan={{ startDate: '2026-01-01', minTargetAmountWon: 10_000_000, maxTargetAmountWon: 20_000_000 }} today="2026-10-25" />,
      { wrapper: createWrapper() }
    )
    expect(screen.queryByText('목표금액을 입력하면 월별 진척을 확인할 수 있습니다')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '월별 목표 진척' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '월별 목표 진척' })).toBeInTheDocument()
  })

  it('목표금액이 없으면 안내 문구를 표시한다', () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 10_000_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    render(
      <IsaProgressSection accountId="a1" plan={{ startDate: '2026-01-01', minTarget: null, maxTarget: null }} today="2026-10-25" />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText('목표금액을 입력하면 월별 진척을 확인할 수 있습니다')).toBeInTheDocument()
  })

  it('조회 중일 때는 로딩 상태를 표시한다', () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: true, isError: false, totalAssets: null, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    render(
      <IsaProgressSection accountId="a1" plan={{ startDate: '2026-01-01', minTarget: 1000, maxTarget: 2000 }} today="2026-10-25" />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText('ISA 진척을 불러오는 중입니다')).toBeInTheDocument()
  })

  it('조회 실패 시 에러 및 재시도 버튼을 표시한다', () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: true, totalAssets: null, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    render(
      <IsaProgressSection accountId="a1" plan={{ startDate: '2026-01-01', minTarget: 1000, maxTarget: 2000 }} today="2026-10-25" />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText('현재 평가금액을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('만기 이후에는 만기 후 안내 문구를 표시한다', () => {
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 10_000_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
    render(
      <IsaProgressSection accountId="a1" plan={{ startDate: '2020-01-01', minTarget: 1000, maxTarget: 2000 }} today="2026-10-25" />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText(/만기 후 현재 평가금액입니다/)).toBeInTheDocument()
  })
})
