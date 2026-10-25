import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { KisStatusInfo } from '../../../src/ui/accounts/useKisStatus'
import { AccountCard } from '../../../src/ui/accounts/AccountCard'
import * as kisToken from '../../../src/ui/accounts/useKisToken'

vi.mock('../../../src/ui/accounts/useKisToken', () => ({ useKisToken: vi.fn() }))

const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: ['29'], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }

const renderCard = (kisStatus?: KisStatusInfo) => {
  const onSelect = vi.fn()
  const onEdit = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><AccountCard account={account} onSelect={onSelect} onEdit={onEdit} kisStatus={kisStatus} /></QueryClientProvider>)
  return { onSelect, onEdit }
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('AccountCard KIS 상태 아이콘', () => {
  it('확인 중에는 스피너 아이콘과 연결 확인 중 레이블을 표시한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate: vi.fn() } as never)
    renderCard()
    const button = screen.getByRole('button', { name: '연결 확인 중' })
    expect(button).toHaveAttribute('title', '연결 확인 중')
    expect(button.querySelector('svg')).toHaveClass('animate-spin')
  })

  it('연결됨이면 Check 아이콘과 만료 시각 레이블을 표시한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate: vi.fn() } as never)
    renderCard({ status: 'connected', expiresAt: Date.UTC(2026, 0, 1, 3, 5) })
    const button = screen.getByRole('button', { name: '연결됨 · 만료 12:05' })
    expect(button).toHaveAttribute('title', '연결됨 · 만료 12:05')
  })

  it('연결 실패면 X 아이콘과 다시 확인 레이블을 표시한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate: vi.fn() } as never)
    renderCard({ status: 'error' })
    expect(screen.getByRole('button', { name: '연결 실패 · 다시 확인' })).toBeInTheDocument()
  })

  it('클릭하면 KIS 토큰을 재확인한다', () => {
    const mutate = vi.fn()
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate } as never)
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: '연결 확인 중' }))
    expect(mutate).toHaveBeenCalledWith(account.id, expect.any(Object))
  })

  it('진행 중에는 disabled이고 스피너를 표시한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: true, mutate: vi.fn() } as never)
    renderCard({ status: 'connected', expiresAt: Date.UTC(2026, 0, 1, 3, 5) })
    const button = screen.getByRole('button', { name: '연결 확인 중' })
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toHaveClass('animate-spin')
  })
})

describe('계좌 카드 표시', () => {
  it('계좌번호를 표시한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate: vi.fn() } as never)
    renderCard()
    expect(screen.getByText('12345678')).toBeInTheDocument()
  })
})
