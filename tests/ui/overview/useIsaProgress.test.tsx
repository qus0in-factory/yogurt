import '@testing-library/jest-dom/vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { getAccountAssets } from '../../../src/app/kis/account-assets-client'
import { useIsaProgress } from '../../../src/ui/overview/useIsaProgress'

vi.mock('../../../src/app/kis/account-assets-client', () => ({
  getAccountAssets: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useIsaProgress', () => {
  it('확정사항 1: 총자산(totalAssets)을 진척 기준 금액으로 반환한다', async () => {
    vi.mocked(getAccountAssets).mockResolvedValueOnce({
      rows: [],
      summary: {
        totalAssets: 15_000_000,
        netAssets: 12_000_000,
        evaluationAmount: 10_000_000,
        purchaseAmount: 8_000_000,
        profitLoss: 2_000_000,
        loanAmount: 0,
        deposit: 5_000_000,
        totalDeposit: 5_000_000,
        cmaEvaluation: 0,
        foreignEvaluation: 0,
      },
    })

    const { result } = renderHook(() => useIsaProgress('acc-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    expect(result.current.totalAssets).toBe(15_000_000)
    expect(getAccountAssets).toHaveBeenCalledWith('acc-1', '01')
  })

  it('조회 실패 시 isError와 retry 함수를 제공한다', async () => {
    vi.mocked(getAccountAssets).mockRejectedValueOnce(new Error('fail'))
    const { result } = renderHook(() => useIsaProgress('acc-2'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.totalAssets).toBeNull()
    expect(typeof result.current.refetch).toBe('function')
  })
})
