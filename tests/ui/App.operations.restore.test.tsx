import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../../src/app/auth/client'
import { LAST_PAGE_STORAGE_KEY } from '../../src/infra/navigation/last-page-storage'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(async () => {}) }))
vi.mock('../../src/app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))

const checkSession = vi.mocked(auth.checkSession)

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  vi.clearAllMocks()
})
afterEach(cleanup)

describe('운용 화면 복원', () => {
  it('마지막 페이지가 운용이면 새로고침 후에도 운용 화면이 복원된다', async () => {
    localStorage.setItem(LAST_PAGE_STORAGE_KEY, JSON.stringify({ version: 1, screen: 'operations' }))
    checkSession.mockResolvedValueOnce(true)
    const { App } = await import('../../src/ui/App')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
    expect(await screen.findByRole('heading', { name: '운용' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '운용' })).toHaveAttribute('aria-current', 'page')
  })
})
