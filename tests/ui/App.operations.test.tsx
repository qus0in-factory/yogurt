import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as accounts from '../../src/app/accounts/client'
import * as auth from '../../src/app/auth/client'
import { App } from '../../src/ui/App'
import { useUiStore } from '../../src/ui/state/ui-store'
import { useOperationsStore } from '../../src/ui/state/operations-store'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(async () => {}) }))
vi.mock('../../src/app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
vi.mock('../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn(), reorderAccounts: vi.fn() }))
vi.mock('../../src/app/portfolio/client', () => ({ listPortfolios: vi.fn(async () => []) }))
vi.mock('../../src/app/portfolio/assignments-client', () => ({ listPortfolioAssignments: vi.fn(async () => []) }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const checkSession = vi.mocked(auth.checkSession)
const listAccounts = vi.mocked(accounts.listAccounts)
const account = { id: 'a1', alias: 'ISA', owner: '홍길동', accountNumber: '1234', products: ['01'], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }

const renderApp = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false })
  useOperationsStore.setState({ tab: 'portfolio' })
  listAccounts.mockResolvedValue([account])
})
afterEach(cleanup)

describe('운용 화면', () => {
  it('메뉴에서 운용을 누르면 운용 화면과 기본 탭(포트폴리오)이 보인다', async () => {
    checkSession.mockResolvedValueOnce(true)
    renderApp()
    await screen.findByRole('heading', { name: '계좌' })
    fireEvent.click(screen.getByRole('button', { name: '운용' }))
    expect(await screen.findByRole('heading', { name: '운용' })).toBeInTheDocument()
    expect(await screen.findByText('포트폴리오가 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '운용' })).toHaveAttribute('aria-current', 'page')
  })

  it('하위 메뉴에서 리밸런싱을 누르면 운용 화면으로 이동하고 리밸런싱 탭이 선택된다', async () => {
    checkSession.mockResolvedValueOnce(true)
    renderApp()
    await screen.findByRole('heading', { name: '계좌' })
    fireEvent.click(screen.getByRole('button', { name: '리밸런싱' }))
    expect(await screen.findByRole('heading', { name: '운용' })).toBeInTheDocument()
    expect(screen.getByText('포트폴리오 기반 리밸런싱 기능을 준비하고 있습니다')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '리밸런싱' })).toHaveAttribute('aria-selected', 'true')
  })
})
