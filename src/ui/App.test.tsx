import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../app/auth/client'
import { App } from './App'
import { useUiStore } from './store/ui-store'

vi.mock('../app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
const checkSession = vi.mocked(auth.checkSession)
const login = vi.mocked(auth.login)
const logout = vi.mocked(auth.logout)

const renderApp = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
}

beforeEach(() => useUiStore.setState({ screen: 'dashboard', drawerOpen: false }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('App', () => {
  it('세션 확인 중에는 확인 중…을 표시한다', () => {
    checkSession.mockReturnValue(new Promise(() => {}))
    renderApp()
    expect(screen.getByText('확인 중…')).toBeInTheDocument()
  })
  it('세션 확인 오류 시 연결 오류와 다시 시도 버튼을 표시하고 재시도한다', async () => {
    checkSession.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(true)
    renderApp()
    expect(await screen.findByText('연결 오류')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()
  })
  it('세션 401이면 로그인 화면을 표시한다', async () => {
    checkSession.mockResolvedValueOnce(false)
    renderApp()
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })
  it('세션 200이면 대시보드 셸을 표시한다', async () => {
    checkSession.mockResolvedValueOnce(true)
    renderApp()
    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()
  })
  it('메뉴 전환과 aria-current를 지원한다', async () => {
    checkSession.mockResolvedValueOnce(true)
    renderApp()
    await screen.findByRole('heading', { name: '대시보드' })
    fireEvent.click(screen.getByRole('button', { name: '계좌/자산' }))
    expect(screen.getByRole('heading', { name: '계좌/자산' })).toBeInTheDocument()
    const tx = screen.getByRole('button', { name: '거래' })
    fireEvent.click(tx)
    expect(tx).toHaveAttribute('aria-current', 'page')
  })
  it('로그인 성공 시 셸로 전환되고 로그아웃 시 로그인 화면으로 돌아간다', async () => {
    checkSession.mockResolvedValueOnce(false)
    login.mockResolvedValueOnce(true)
    logout.mockResolvedValueOnce()
    renderApp()
    await screen.findByRole('heading', { name: '로그인' })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })
  it('모바일 메뉴 버튼으로 drawer를 연다', async () => {
    checkSession.mockResolvedValueOnce(true)
    renderApp()
    const button = await screen.findByRole('button', { name: '메뉴' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: '메뉴' })).toBeInTheDocument()
  })
})
