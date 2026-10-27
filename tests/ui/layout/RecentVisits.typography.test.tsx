import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../../src/domain/accounts/account'
import { RecentVisits } from '../../../src/ui/layout/RecentVisits'
import { useRecentVisitsStore, type RecentVisit } from '../../../src/ui/state/recent-visits'
import { queryClient } from '../../../src/ui/state/query-client'

const accounts: Account[] = [
  { id: 'a1', alias: '주계좌', owner: '홍길동', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00Z' },
]
const visits: RecentVisit[] = [
  { screen: 'overview', tab: 'pension', accountId: 'a1', label: '주계좌 · 연금저축' },
  { screen: 'accounts', label: '계좌 홈' },
]

beforeEach(() => {
  localStorage.clear()
  queryClient.clear()
  queryClient.setQueryData(['accounts'], accounts)
  useRecentVisitsStore.setState({ visits })
})
afterEach(cleanup)

describe('최근 방문 제목과 항목의 글자 크기 교환', () => {
  it('제목이 text-sm 크기를 사용하고 항목이 text-xs 크기를 사용한다', () => {
    render(<RecentVisits current="accounts" onNavigate={vi.fn()} />)
    const title = screen.getByText('최근 방문')
    const list = screen.getByRole('list', { name: '최근 방문' })
    const buttons = within(list).getAllByRole('button')

    // 제목: before는 text-xs였으나 after는 text-sm (색상 text-stone-500 유지)
    expect(title).toHaveClass('text-sm')
    expect(title).toHaveClass('text-stone-500')
    expect(title).not.toHaveClass('text-xs')

    // 항목: before는 text-sm이었으나 after는 text-xs (굵기 font-medium, truncate 유지)
    for (const btn of buttons) {
      expect(btn).toHaveClass('text-xs')
      expect(btn).toHaveClass('font-medium')
      expect(btn).toHaveClass('truncate')
    }
  })

  it('모바일 375px 환경에서 긴 항목이 truncate 래퍼로 감싸져 줄바꿈되거나 넘치지 않는다', () => {
    render(
      <div style={{ width: 375 }}>
        <RecentVisits current="accounts" onNavigate={vi.fn()} />
      </div>,
    )
    const list = screen.getByRole('list', { name: '최근 방문' })
    const buttons = within(list).getAllByRole('button')
    for (const btn of buttons) {
      const inner = btn.querySelector('span.truncate')
      expect(inner).toBeInTheDocument()
      expect(inner).toHaveClass('truncate')
      expect(inner).toHaveClass('min-w-0')
    }
  })
})
