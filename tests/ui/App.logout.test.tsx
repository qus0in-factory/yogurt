import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../../src/app/auth/client'
import { App } from '../../src/ui/App'
import { useUiStore } from '../../src/ui/state/ui-store'

vi.mock('../../src/app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
const checkSession = vi.mocked(auth.checkSession)
const logout = vi.mocked(auth.logout)

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('App 로그아웃 버튼', () => {
  it('접근 이름 로그아웃과 svg를 갖고 클릭 시 로그아웃을 호출한다', async () => {
    useUiStore.setState({ screen: 'accounts', drawerOpen: false })
    checkSession.mockResolvedValueOnce(true)
    logout.mockResolvedValueOnce()
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
    const button = await screen.findByRole('button', { name: '로그아웃' })
    expect(button.querySelector('svg')).toBeInTheDocument()
    fireEvent.click(button)
    await screen.findByRole('heading', { name: '로그인' })
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
