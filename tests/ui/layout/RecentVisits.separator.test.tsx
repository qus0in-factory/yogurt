import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../../src/domain/accounts/account'
import { MenuDrawer } from '../../../src/ui/layout/MenuDrawer'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { useRecentVisitsStore, type RecentVisit } from '../../../src/ui/state/recent-visits'
import { queryClient } from '../../../src/ui/state/query-client'

const accounts: Account[] = [
  { id: 'a1', alias: '주계좌', owner: '홍길동', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00Z' },
]
const visits: RecentVisit[] = [{ screen: 'accounts', label: '계좌 홈' }]

beforeEach(() => {
  localStorage.clear()
  queryClient.clear()
  queryClient.setQueryData(['accounts'], accounts)
  useRecentVisitsStore.setState({ visits })
})
afterEach(cleanup)

function separator() {
  const hr = document.querySelector('hr')
  expect(hr).toHaveAttribute('aria-hidden', 'true')
  expect(hr).toHaveClass('border-t', 'border-stone-200')
  return hr!
}

describe('계좌와 최근 방문 사이 구분선', () => {
  it('사이드바에서 계좌 다음·최근 방문 이전에 있다', () => {
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    const hr = separator()
    const [accountMenu] = screen.getAllByRole('button', { name: '계좌' })
    const list = screen.getByRole('list', { name: '최근 방문' })
    expect(accountMenu.compareDocumentPosition(hr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(hr.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('모바일 메뉴에서도 계좌 다음·최근 방문 이전에 있다', () => {
    render(<MenuDrawer open current="accounts" onNavigate={vi.fn()} onClose={vi.fn()} />)
    const hr = separator()
    const [accountMenu] = screen.getAllByRole('button', { name: '계좌' })
    const list = screen.getByRole('list', { name: '최근 방문' })
    expect(accountMenu.compareDocumentPosition(hr) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(hr.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('기록이 없으면 두 메뉴 모두 구분선이 없다', () => {
    useRecentVisitsStore.setState({ visits: [] })
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    expect(document.querySelector('hr')).not.toBeInTheDocument()
    cleanup()
    render(<MenuDrawer open current="accounts" onNavigate={vi.fn()} onClose={vi.fn()} />)
    expect(document.querySelector('hr')).not.toBeInTheDocument()
  })
})
