import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { IrpTab } from '../../../src/ui/overview/IrpTab'
import { useUiStore } from '../../../src/ui/state/ui-store'
vi.mock('../../../src/ui/accounts/useAccounts', () => ({ useAccounts: () => ({
  data: ['a', 'b'].map(id => ({ id, alias: id, owner: '소유자', products: ['29'], accountNumber: '12345678' })),
  isPending: false,
}) }))
vi.mock('../../../src/ui/overview/IrpDetail', () => ({ IrpDetail: ({ accountId }: { accountId: string }) => <p>상세:{accountId}</p> }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); useUiStore.setState({ selectedIrpAccountId: null }) })
it('IRP 계좌를 선택하면 상세를 열고 다른 계좌로 전환하며 다시 누르면 닫는다', () => {
  useUiStore.setState({ selectedIrpAccountId: null })
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<QueryClientProvider client={new QueryClient()}><IrpTab /></QueryClientProvider>)
  const a = screen.getByRole('button', { name: '소유자 a 12345678' })
  const b = screen.getByRole('button', { name: '소유자 b 12345678' })
  fireEvent.click(a)
  expect(a).toHaveAttribute('aria-pressed', 'true')
  expect(useUiStore.getState().selectedIrpAccountId).toBe('a')
  expect(screen.getByText('상세:a')).toBeInTheDocument()
  fireEvent.click(b)
  expect(a).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByText('상세:b')).toBeInTheDocument()
  fireEvent.click(b)
  expect(screen.queryByText('상세:b')).not.toBeInTheDocument()
  expect(useUiStore.getState().selectedIrpAccountId).toBeNull()
})
