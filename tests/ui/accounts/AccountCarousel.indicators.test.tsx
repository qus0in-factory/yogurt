import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { AccountCarousel } from '../../../src/ui/accounts/AccountCarousel'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it.each([1, 3])('데스크톱 계좌 %i개가 한 페이지이면 모든 페이지 인디케이터를 숨긴다', count => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  const accounts = Array.from({ length: count }, (_, index) => ({
    id: String(index), alias: `계좌${index}`, owner: '소유자', accountNumber: '12345678', products: [], createdAt: '',
  }))
  render(<QueryClientProvider client={new QueryClient()}><AccountCarousel accounts={accounts} onEdit={vi.fn()} /></QueryClientProvider>)
  expect(screen.getAllByRole('group')).toHaveLength(count)
  expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '1번째 페이지로 이동' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '이전 계좌' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '다음 계좌' })).not.toBeInTheDocument()
})
