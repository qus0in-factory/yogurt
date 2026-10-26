import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../../src/domain/accounts/account'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { MenuDrawer } from '../../../src/ui/layout/MenuDrawer'
import { useRecentVisitsStore, type RecentVisit, RECENT_VISITS_STORAGE_KEY } from '../../../src/ui/state/recent-visits'
import { useUiStore } from '../../../src/ui/state/ui-store'
import { useOperationsStore } from '../../../src/ui/state/operations-store'
import { queryClient } from '../../../src/ui/state/query-client'

const accounts: Account[] = [
  { id: 'a1', alias: '주계좌', owner: '홍길동', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'a2', alias: '퇴직계좌', owner: '김철수', accountNumber: '87654321', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00Z' },
]
const visits: RecentVisit[] = [
  { screen: 'overview', tab: 'pension', accountId: 'a1', label: '주계좌 · 연금저축' },
  { screen: 'operations', tab: 'rebalancing', label: '운용 · 리밸런싱' },
  { screen: 'accounts', label: '계좌 홈' },
]

beforeEach(() => {
  localStorage.clear()
  queryClient.clear()
  queryClient.setQueryData(['accounts'], accounts)
  useRecentVisitsStore.setState({ visits })
  useUiStore.setState({ overviewTab: 'isa', selectedProductAccountIds: {}, selectedAccountId: null })
  useOperationsStore.setState({ tab: 'portfolio' })
})
afterEach(cleanup)

describe('최근 방문 목록', () => {
  it('사이드바 계좌 아래에 최신순으로 표시하고 현재 항목과 44px 터치를 적용한다', () => {
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    const list = screen.getByRole('list', { name: '최근 방문' })
    const [accountMenu] = screen.getAllByRole('button', { name: '계좌' })
    expect(accountMenu.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(list).getAllByRole('button').map((button) => button.textContent)).toEqual(['12345678 · 연금저축', '운용 · 리밸런싱', '계좌 홈'])
    expect(within(list).queryByText(/주계좌/)).not.toBeInTheDocument()
    expect(within(list).getByRole('button', { name: '계좌 홈' })).toHaveAttribute('aria-current', 'page')
    for (const button of within(list).getAllByRole('button')) expect(button).toHaveClass('min-h-11')
  })

  it('현황·운용·계좌 항목 클릭 시 기존 이동 흐름을 호출한다', () => {
    const onNavigate = vi.fn()
    render(<Sidebar current="accounts" onNavigate={onNavigate} />)
    const list = screen.getByRole('list', { name: '최근 방문' })
    fireEvent.click(within(list).getByRole('button', { name: /12345678/ }))
    expect(onNavigate).toHaveBeenCalledWith('overview')
    expect(useUiStore.getState().overviewTab).toBe('pension')
    expect(useUiStore.getState().selectedProductAccountIds.pension).toBe('a1')
    expect(localStorage.getItem(RECENT_VISITS_STORAGE_KEY)).not.toContain('12345678')
    fireEvent.click(within(list).getByRole('button', { name: '운용 · 리밸런싱' }))
    expect(onNavigate).toHaveBeenCalledWith('operations')
    expect(useOperationsStore.getState().tab).toBe('rebalancing')
    fireEvent.click(within(list).getByRole('button', { name: '계좌 홈' }))
    expect(onNavigate).toHaveBeenCalledWith('accounts')
  })

  it('모바일 메뉴에도 같은 목록을 표시하고 클릭 시 닫는다', () => {
    const onNavigate = vi.fn()
    const onClose = vi.fn()
    render(<MenuDrawer open current="accounts" onNavigate={onNavigate} onClose={onClose} />)
    const list = screen.getByRole('list', { name: '최근 방문' })
    expect(within(list).getAllByRole('button')).toHaveLength(3)
    fireEvent.click(within(list).getByRole('button', { name: '운용 · 리밸런싱' }))
    expect(onNavigate).toHaveBeenCalledWith('operations')
    expect(onClose).toHaveBeenCalled()
  })

  it('항목이 없으면 사이드바와 모바일 메뉴에서 영역을 숨긴다', () => {
    useRecentVisitsStore.setState({ visits: [] })
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    expect(screen.queryByRole('list', { name: '최근 방문' })).not.toBeInTheDocument()
    cleanup()
    render(<MenuDrawer open current="accounts" onNavigate={vi.fn()} onClose={vi.fn()} />)
    expect(screen.queryByRole('list', { name: '최근 방문' })).not.toBeInTheDocument()
  })
})
