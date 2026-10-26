import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../../src/domain/accounts/account'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { useRecentVisitsStore, type RecentVisit } from '../../../src/ui/state/recent-visits'
import { useMaskStore } from '../../../src/ui/state/mask-store'
import { useUiStore } from '../../../src/ui/state/ui-store'
import { queryClient } from '../../../src/ui/state/query-client'

const accounts: Account[] = [
  { id: 'a1', alias: '주계좌', owner: '홍길동', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00Z' },
]
const visit: RecentVisit = { screen: 'overview', tab: 'pension', accountId: 'a1', label: '주계좌 · 연금저축' }

beforeEach(() => {
  localStorage.clear()
  queryClient.clear()
  queryClient.setQueryData(['accounts'], accounts)
  useRecentVisitsStore.setState({ visits: [visit, { screen: 'operations', tab: 'rebalancing', label: '운용 · 리밸런싱' }] })
  useMaskStore.setState({ masked: false })
  useUiStore.setState({ overviewTab: 'isa', selectedProductAccountIds: {}, selectedAccountId: null })
})
afterEach(cleanup)

describe('최근 방문 계좌번호 표시', () => {
  it('계좌번호는 가리기 대상이고 화면 라벨은 가리지 않는다', () => {
    useMaskStore.setState({ masked: true })
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    const list = screen.getByRole('list', { name: '최근 방문' })
    const number = within(list).getByText('12345678')
    expect(number).toHaveAttribute('data-masked', 'true')
    expect(number).toHaveClass('blur-[6px]')
    expect(within(list).getByText('연금저축')).not.toHaveAttribute('data-sensitive')
    const operations = within(list).getByRole('button', { name: '운용 · 리밸런싱' })
    expect(operations).not.toHaveAttribute('data-sensitive')
    expect(operations).not.toHaveClass('blur-[6px]')
  })

  it('계좌 항목 클릭은 표시가 아니라 계좌 id로 이동한다', () => {
    useRecentVisitsStore.setState({ visits: [{ screen: 'accounts', accountId: 'a1', label: '주계좌' }] })
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    fireEvent.click(within(screen.getByRole('list', { name: '최근 방문' })).getByRole('button', { name: '12345678' }))
    expect(useUiStore.getState().selectedAccountId).toBe('a1')
  })

  it('계좌를 찾지 못하면 해당 항목과 빈 목록 영역을 숨긴다', () => {
    useRecentVisitsStore.setState({ visits: [{ screen: 'accounts', accountId: 'missing', label: '' }] })
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    expect(screen.queryByRole('list', { name: '최근 방문' })).not.toBeInTheDocument()
  })
})
