import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { KisStatusInfo } from '../../../src/ui/accounts/useKisStatus'
import { AccountCard } from '../../../src/ui/accounts/AccountCard'

const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: ['29'], createdAt: '2026-01-01T00:00:00.000Z' }

const renderCard = (kisStatus?: KisStatusInfo) => {
  const onSelect = vi.fn()
  const onEdit = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><AccountCard account={account} onSelect={onSelect} onEdit={onEdit} kisStatus={kisStatus} /></QueryClientProvider>)
  return { onSelect, onEdit }
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('계좌 카드 KIS 상태 배지', () => {
  it('기존 KIS 연결 확인 버튼을 유지한다', () => {
    renderCard()
    expect(screen.getByRole('button', { name: 'KIS 연결 확인' })).toHaveClass('gap-2')
  })

  it('상태가 없으면 확인 중 배지를 표시한다', () => {
    renderCard()
    expect(screen.getByText('확인 중')).toBeInTheDocument()
  })

  it('연결됨이면 서울 시간 만료를 아이콘과 표시한다', () => {
    renderCard({ status: 'connected', expiresAt: Date.UTC(2026, 0, 1, 3, 5) })
    expect(screen.getByText('연결됨 · 만료 12:05')).toBeInTheDocument()
  })

  it('만료 정보가 없는 연결은 시각 없이 표시한다', () => {
    renderCard({ status: 'connected' })
    expect(screen.getByText('연결됨')).toBeInTheDocument()
  })

  it('연결 실패면 경고를 표시한다', () => {
    renderCard({ status: 'error' })
    expect(screen.getByText('연결 실패')).toBeInTheDocument()
  })

  it('배지는 aria-hidden 아이콘과 텍스트를 gap-2로 표시한다', () => {
    renderCard({ status: 'connected', expiresAt: Date.UTC(2026, 0, 1, 3, 5) })
    const badge = screen.getByTestId('kis-status')
    expect(badge).toHaveClass('gap-2')
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(badge).not.toHaveTextContent('accessKey')
  })
})

describe('계좌 카드 표시', () => {
  it('계좌번호를 표시한다', () => {
    renderCard()
    expect(screen.getByText('12345678')).toBeInTheDocument()
  })
})
