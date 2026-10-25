import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import type { Account } from '../../../src/domain/accounts/account'
import { AccountCarousel } from '../../../src/ui/accounts/AccountCarousel'

vi.mock('../../../src/ui/components/Carousel', () => ({
  Carousel: ({ items, renderItem }: { items: Account[]; renderItem: (item: Account) => React.ReactNode }) => items.map(renderItem),
}))
afterEach(cleanup)
it('passes each account status to its card', () => {
  const accounts = ['a', 'b'].map(id => ({
    id, alias: id, owner: '소유자', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '',
  }))
  const statuses = new Map([
    ['a', { status: 'error' as const }],
    ['b', { status: 'connected' as const, expiresAt: Date.UTC(2026, 0, 1, 3, 5) }],
  ])
  render(<QueryClientProvider client={new QueryClient()}>
    <AccountCarousel accounts={accounts} onEdit={vi.fn()} kisStatuses={statuses} />
  </QueryClientProvider>)
  expect(screen.getByRole('button', { name: '연결 실패 · 다시 확인' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '연결됨 · 만료 12:05' })).toBeInTheDocument()
})
