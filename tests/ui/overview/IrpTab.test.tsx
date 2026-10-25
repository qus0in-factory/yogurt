import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { IrpTab } from '../../../src/ui/overview/IrpTab'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn() }))
const listAccounts = vi.mocked(client.listAccounts)
const base = { owner: '김철수', accountNumber: '12345678', productCode: '29', createdAt: '2026-01-01T00:00:00.000Z' }
const accounts = Array.from({ length: 4 }, (_, index) => ({ ...base, id: String(index), alias: `IRP${index + 1}` }))
let wide = false

const renderTab = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><IrpTab /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  wide = false
  listAccounts.mockResolvedValue(accounts)
  vi.stubGlobal('matchMedia', () => ({ matches: wide, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('IrpTab carousel', () => {
  it('모바일에서는 한 장씩 넘기고 페이지 위치를 표시한다', async () => {
    renderTab()
    expect(await screen.findByText('IRP1')).toBeInTheDocument()
    expect(screen.queryByText('IRP2')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '다음 계좌' }))
    expect(screen.getByText('IRP2')).toBeInTheDocument()
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
  })

  it('데스크톱에서는 세 장씩 보여준다', async () => {
    wide = true
    renderTab()
    expect(await screen.findByText('IRP1')).toBeInTheDocument()
    expect(screen.getByText('IRP3')).toBeInTheDocument()
    expect(screen.queryByText('IRP4')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })
})
