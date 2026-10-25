import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IsaProgressSection } from '../../../src/ui/overview/IsaProgressSection'
import * as useIsaProgressModule from '../../../src/ui/overview/useIsaProgress'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('IsaProgressSection responsive desktop/mobile', () => {
  let listeners: Array<() => void> = []
  let matchesValue = true

  beforeEach(() => {
    listeners = []
    matchesValue = true
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() { return matchesValue },
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        listeners = listeners.filter((l) => l !== fn)
      },
    }))
    vi.spyOn(useIsaProgressModule, 'useIsaProgress').mockReturnValue({
      isPending: false, isError: false, totalAssets: 25_200_000, dataUpdatedAt: 0, refetch: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const plan = { startDate: '2024-01-15', minTargetAmountWon: 36_000_000, maxTargetAmountWon: 72_000_000 }

  it('데스크톱(768px 이상): 구간 7칸, 가운데 칸 현재 월', () => {
    matchesValue = true
    render(<IsaProgressSection accountId="a1" plan={plan} today="2026-10-25" />, { wrapper: createWrapper() })
    const monthTexts = screen.getAllByTestId('month-tick')
    expect(monthTexts).toHaveLength(7)
    expect(monthTexts[3]).toHaveTextContent('26.10')
  })

  it('모바일(768px 미만): 구간 3칸, 가운데 칸 현재 월, 앞뒤 1개월만', () => {
    matchesValue = false
    render(<IsaProgressSection accountId="a1" plan={plan} today="2026-10-25" />, { wrapper: createWrapper() })
    const monthTexts = screen.getAllByTestId('month-tick')
    expect(monthTexts).toHaveLength(3)
    expect(monthTexts[0]).toHaveTextContent('26.09')
    expect(monthTexts[1]).toHaveTextContent('26.10')
    expect(monthTexts[2]).toHaveTextContent('26.11')
  })

  it('폭이 바뀌면(데스크톱->모바일) 구간 칸 수가 바뀐다', () => {
    matchesValue = true
    render(<IsaProgressSection accountId="a1" plan={plan} today="2026-10-25" />, { wrapper: createWrapper() })
    expect(screen.getAllByTestId('month-tick')).toHaveLength(7)
    matchesValue = false
    act(() => { listeners.forEach((fn) => fn()) })
    expect(screen.getAllByTestId('month-tick')).toHaveLength(3)
  })
})
