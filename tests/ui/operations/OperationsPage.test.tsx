import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationsPage } from '../../../src/ui/operations/OperationsPage'
import { useOperationsStore } from '../../../src/ui/state/operations-store'

vi.mock('../../../src/app/portfolio/client', () => ({ listPortfolios: vi.fn(async () => []) }))
vi.mock('../../../src/app/portfolio/assignments-client', () => ({ listPortfolioAssignments: vi.fn(async () => []) }))
vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(async () => []) }))

function renderOperationsPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><OperationsPage /></QueryClientProvider>)
}

afterEach(cleanup)

describe('OperationsPage', () => {
  beforeEach(() => {
    useOperationsStore.setState({ tab: 'portfolio' })
  })

  it('포트폴리오와 리밸런싱 탭 2개를 렌더링하고 포트폴리오를 기본 선택한다', async () => {
    renderOperationsPage()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['포트폴리오', '리밸런싱'])
    expect(screen.getByRole('tab', { name: '포트폴리오' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '리밸런싱' })).toHaveAttribute('aria-selected', 'false')
    expect(await screen.findByText('포트폴리오가 없습니다')).toBeInTheDocument()
  })

  it('리밸런싱 탭을 클릭하면 연결 포트폴리오가 없을 때 안내 화면이 보인다', async () => {
    renderOperationsPage()
    fireEvent.click(screen.getByRole('tab', { name: '리밸런싱' }))
    expect(screen.getByRole('tab', { name: '리밸런싱' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '포트폴리오' })).toHaveAttribute('aria-selected', 'false')
    expect(await screen.findByText('선택 가능한 연결 포트폴리오가 없습니다.')).toBeInTheDocument()
  })
})
