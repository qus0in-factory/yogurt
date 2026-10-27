// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import * as hooks from '../../../../src/app/rebalance/useRebalanceInputs'
import { RebalanceSection } from '../../../../src/ui/operations/rebalance/RebalanceSection'
vi.mock('../../../../src/app/rebalance/useRebalanceInputs')
vi.mock('../../../../src/ui/accounts/useAccounts', () => ({ useAccounts: () => ({ data: [] }) }))
afterEach(cleanup)
function show(priceFailed: string[]) {
  vi.mocked(hooks.useTargetAccounts).mockReturnValue([{
    accountId: 'a', productCode: '22', accountNumber: '12345678', alias: '', portfolioId: 'p', portfolioName: '목표',
  }])
  const inputs = {
    holdings: [{ code: '005930', name: '삼성전자', quantity: 2, evaluationAmount: 100 }], cash: 1000,
    targets: [{ code: '035420', name: 'NAVER', kind: 'stock' as const, weightBps: 10000 }],
    prices: {}, priceFailed, hasPortfolio: true,
  }
  vi.mocked(hooks.useRebalanceInputs).mockReturnValue({ data: inputs, isLoading: false } as never)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><RebalanceSection /></QueryClientProvider>)
}
it('시세 실패 목록이 비어 있으면 안내가 없다', () => {
  show([])
  expect(screen.queryByText(/시세를 가져오지 못한 종목이 있습니다/)).not.toBeInTheDocument()
})
it('목표·보유 종목명과 대체 코드를 아이콘이 있는 상태 메시지로 안내한다', () => {
  show(['035420', '005930', '999999'])
  const notice = screen.getByText('시세를 가져오지 못한 종목이 있습니다: NAVER (035420), 삼성전자 (005930), 999999. 해당 종목은 계획에서 제외됩니다.')
  const status = notice.closest('[role="status"]')
  expect(status).toBeInTheDocument()
  expect(status?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})
it('실패 종목의 가격 없음 표시와 매매 비활성을 유지한다', () => {
  show(['035420'])
  const button = screen.getByRole('button', { name: 'NAVER 가격 없음' })
  expect(button).toBeDisabled()
  fireEvent.click(button)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
