import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { checkSession, logout } from '../../../src/app/auth/client'
import { clearClientStorage } from '../../../src/ui/state/clear-client-storage'
import { useLogout, useSession } from '../../../src/ui/auth/useSession'

vi.mock('../../../src/app/auth/client', () => ({ checkSession: vi.fn(), logout: vi.fn(), login: vi.fn() }))
vi.mock('../../../src/ui/state/clear-client-storage', () => ({ clearClientStorage: vi.fn(async () => {}) }))
const clients: QueryClient[] = []
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  clients.push(client)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
afterEach(() => {
  cleanup()
  clients.splice(0).forEach(client => client.clear())
  vi.resetAllMocks()
})

it('로그아웃 성공 시 전체 정리를 기다리고 미인증 상태로 바꾼다', async () => {
  vi.mocked(logout).mockResolvedValueOnce()
  const { result } = renderHook(() => useLogout(), { wrapper })
  await act(async () => { await result.current.mutateAsync() })
  expect(clearClientStorage).toHaveBeenCalledTimes(1)
  expect(clients[0].getQueryData(['session'])).toBe(false)
})

it('세션 조회가 미인증이면 전체 정리를 호출한다', async () => {
  vi.mocked(checkSession).mockResolvedValueOnce(false)
  const { result } = renderHook(() => useSession(), { wrapper })
  await waitFor(() => expect(result.current.data).toBe(false))
  expect(clearClientStorage).toHaveBeenCalledTimes(1)
})

it('로그아웃 실패 시 저장소를 지우지 않는다', async () => {
  vi.mocked(logout).mockRejectedValueOnce(new Error('network'))
  const { result } = renderHook(() => useLogout(), { wrapper })
  await act(async () => { await expect(result.current.mutateAsync()).rejects.toThrow('network') })
  expect(clearClientStorage).not.toHaveBeenCalled()
})
