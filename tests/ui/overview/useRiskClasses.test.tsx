import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getRiskClasses, setRiskClass } from '../../../src/app/kis/risk-class-client'
import { useRiskClasses } from '../../../src/ui/overview/useRiskClasses'

vi.mock('../../../src/app/kis/risk-class-client', () => ({ getRiskClasses: vi.fn(), setRiskClass: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
beforeEach(() => { vi.mocked(getRiskClasses).mockResolvedValue({}) })
afterEach(() => { cleanup(); vi.clearAllMocks() })

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return renderHook(() => useRiskClasses('a'), { wrapper })
}

it('저장에 성공하면 같은 계좌·상품의 위험 구분을 다시 조회한다', async () => {
  vi.mocked(setRiskClass).mockResolvedValue({ stockCode: '069500', riskClass: 'safe' })
  const { result } = setup()
  await waitFor(() => expect(result.current.isPending).toBe(false))
  result.current.toggle({ stockCode: '069500', riskClass: 'safe' })
  await waitFor(() => expect(getRiskClasses).toHaveBeenCalledTimes(2))
  expect(getRiskClasses).toHaveBeenLastCalledWith('a', '29')
})

it('저장에 실패하면 안내 toast를 표시한다', async () => {
  vi.mocked(setRiskClass).mockRejectedValue(new Error('down'))
  const { result } = setup()
  await waitFor(() => expect(result.current.isPending).toBe(false))
  result.current.toggle({ stockCode: '069500', riskClass: 'safe' })
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('위험/안전 설정을 변경하지 못했습니다'))
})
