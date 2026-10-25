import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as accounts from '../../src/app/accounts/client'
import * as auth from '../../src/app/auth/client'
import { accountsText, authText, commonText, overviewText } from '../../src/ui/glossary'
import { LAST_PAGE_STORAGE_KEY } from '../../src/infra/navigation/last-page-storage'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(async () => {}) }))
vi.mock('../../src/app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
vi.mock('../../src/app/accounts/client', () => ({
  listAccounts: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
  reorderAccounts: vi.fn(),
}))

const checkSession = vi.mocked(auth.checkSession)
const logout = vi.mocked(auth.logout)
const listAccounts = vi.mocked(accounts.listAccounts)
const account = { id: 'a1', alias: 'ISA', owner: '홍길동', accountNumber: '1234', products: ['01'], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  vi.clearAllMocks()
  listAccounts.mockResolvedValue([account])
})
afterEach(cleanup)

describe('App navigation restoration', () => {
  it('저장된 overview 페이지와 유효 세션으로 시작하면 현황 화면을 복원한다', async () => {
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, JSON.stringify({ version: 1, screen: 'overview' }))
    checkSession.mockResolvedValueOnce(true)
    const { App } = await import('../../src/ui/App')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)

    expect(await screen.findByRole('heading', { name: overviewText.title })).toBeInTheDocument()
    const overviewButton = screen.getByRole('button', { name: overviewText.title })
    expect(overviewButton).toHaveAttribute('aria-current', 'page')
  })

  it('미인증 상태에서는 로그인 폼을 표시한다', async () => {
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, JSON.stringify({ version: 1, screen: 'overview' }))
    checkSession.mockResolvedValueOnce(false)
    const { App } = await import('../../src/ui/App')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)

    expect(await screen.findByRole('heading', { name: authText.loginTitle })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: overviewText.title })).not.toBeInTheDocument()
  })

  it('로그아웃 성공 후에는 저장 키가 지워지고 accounts 기본 페이지로 복귀한다', async () => {
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, JSON.stringify({ version: 1, screen: 'overview' }))
    checkSession.mockResolvedValueOnce(true)
    logout.mockResolvedValueOnce()
    const { App } = await import('../../src/ui/App')
    const { useUiStore } = await import('../../src/ui/state/ui-store')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)

    await screen.findByRole('heading', { name: overviewText.title })
    fireEvent.click(screen.getByRole('button', { name: commonText.logout }))
    await screen.findByRole('heading', { name: authText.loginTitle })
    expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBeNull()
    expect(useUiStore.getState().screen).toBe('accounts')
  })
})
