import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as accounts from '../../src/app/accounts/client'
import * as auth from '../../src/app/auth/client'
import { App } from '../../src/ui/App'
import type { ScreenId } from '../../src/ui/layout/menu'
import { useUiStore } from '../../src/ui/state/ui-store'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(async () => {}) }))
vi.mock('../../src/app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
vi.mock('../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn(), reorderAccounts: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const checkSession = vi.mocked(auth.checkSession)
const listAccounts = vi.mocked(accounts.listAccounts)
const account = { id: 'a1', alias: 'IRP 연금', owner: '김철수', accountNumber: '12345678', products: ['01', '29'], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }

const renderApp = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false })
  listAccounts.mockResolvedValue([account])
})
afterEach(cleanup)

describe('현황 화면', () => {
  it('현황 메뉴를 선택하면 현황 화면과 계좌 개수를 표시한다', async () => {
    checkSession.mockResolvedValueOnce(true)
    renderApp()
    await screen.findByRole('heading', { name: '계좌' })
    fireEvent.click(screen.getByRole('button', { name: '현황' }))
    expect(await screen.findByRole('heading', { name: '현황' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'ISA' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('총 1개')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현황' })).toHaveAttribute('aria-current', 'page')
  })

  it('알 수 없는 저장 화면 값이면 계좌 화면으로 처리한다', async () => {
    checkSession.mockResolvedValueOnce(true)
    useUiStore.setState({ screen: 'unknown' as ScreenId })
    renderApp()
    expect(await screen.findByRole('heading', { name: '계좌' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '현황' })).not.toBeInTheDocument()
  })

  it('최상위 레이아웃에 전역 break-keep을 적용한다', async () => {
    checkSession.mockResolvedValueOnce(true)
    const { container } = renderApp()
    await screen.findByRole('heading', { name: '계좌' })
    expect(container.firstElementChild).toHaveClass('break-keep')
    expect(container.firstElementChild).not.toHaveClass('max-md:break-keep')
  })
})
