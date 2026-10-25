import '@testing-library/jest-dom/vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import * as clientModule from '../../../src/app/accounts/client'
import { useIsaLastClose } from '../../../src/ui/overview/useIsaLastClose'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useIsaLastClose', () => {
  it('직전 월 마감 조회 성공 시 data를 반환한다', async () => {
    vi.spyOn(clientModule, 'getIsaLastClose').mockResolvedValueOnce({
      date: '2026-09-30',
      totalAssetsWon: 25_200_000,
    })
    const { result } = renderHook(() => useIsaLastClose('a1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.data).toEqual({ date: '2026-09-30', totalAssetsWon: 25_200_000 })
  })

  it('기록 없음(null) 반환 시 data는 null이다', async () => {
    vi.spyOn(clientModule, 'getIsaLastClose').mockResolvedValueOnce(null)
    const { result } = renderHook(() => useIsaLastClose('a1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.data).toBeNull()
  })

  it('enabled가 false이면 조회를 수행하지 않는다', () => {
    const spy = vi.spyOn(clientModule, 'getIsaLastClose')
    renderHook(() => useIsaLastClose('a1', false), { wrapper: createWrapper() })
    expect(spy).not.toHaveBeenCalled()
  })
})
