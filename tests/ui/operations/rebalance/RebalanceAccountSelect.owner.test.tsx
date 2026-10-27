// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RebalanceAccountSelect } from '../../../../src/ui/operations/rebalance/RebalanceAccountSelect'
import { useTargetAccounts } from '../../../../src/app/rebalance/useRebalanceInputs'
import { useMaskStore } from '../../../../src/ui/state/mask-store'
vi.mock('../../../../src/ui/accounts/useAccounts', () => ({ useAccounts: () => ({ data: [
  { id: 'a', owner: '홍길동', alias: '내ISA', accountNumber: '12345678' },
] }) }))
vi.mock('../../../../src/app/portfolio/queries', () => ({
  usePortfolioAssignments: () => ({ data: [{ accountId: 'a', productCode: '01', portfolioId: 'p' }] }),
  usePortfolios: () => ({ data: [{ id: 'p', name: '성장형' }] }),
}))
const option = { accountId: 'a', productCode: '01' as const, alias: '내ISA', owner: '홍길동', accountNumber: '12345678', portfolioId: 'p', portfolioName: '성장형' }
beforeEach(() => useMaskStore.setState({ masked: false }))
afterEach(() => { cleanup(); useMaskStore.setState({ masked: false }) })
function show(owner: string | null = '홍길동') {
  const onSelectKey = vi.fn()
  render(<RebalanceAccountSelect options={[{ ...option, owner: owner ?? undefined }, { ...option, accountId: 'b' }]}
    selectedKey="a:01" onSelectKey={onSelectKey} keepAmount={0} onChangeKeepAmount={vi.fn()} />)
  return onSelectKey
}
it('계좌 목록의 owner를 연결 옵션에 전달한다', () => {
  const { result } = renderHook(useTargetAccounts)
  expect(result.current[0]).toMatchObject({ owner: '홍길동', alias: '내ISA', accountNumber: '12345678' })
})
it('옵션에 별칭·소유자·상품·계좌번호·포트폴리오를 표시한다', () => {
  show()
  expect(screen.getAllByRole('option')[0]).toHaveTextContent('내ISA · 홍길동 · ISA (12345678) [성장형]')
})
it('가리기 토글은 소유자와 계좌번호만 치환하고 해제하면 원래 값을 복원한다', () => {
  show()
  act(() => useMaskStore.setState({ masked: true }))
  const options = screen.getAllByRole('option')
  expect(options[0]).toHaveTextContent('내ISA · ●●● · ISA (●●●●●●●●) [성장형]')
  for (const opt of options) {
    expect(opt).not.toHaveTextContent('홍길동')
    expect(opt).not.toHaveTextContent('12345678')
  }
  act(() => useMaskStore.setState({ masked: false }))
  expect(options[0]).toHaveTextContent('내ISA · 홍길동 · ISA (12345678) [성장형]')
})
it.each([null, '', '   '])('소유자 %j는 칸을 생략한다', owner => {
  show(owner)
  expect(screen.getAllByRole('option')[0]).toHaveTextContent('내ISA · ISA (12345678) [성장형]')
})
it('옵션을 바꾸면 기존 계좌·상품 키를 전달한다', () => {
  const onSelect = show()
  fireEvent.change(screen.getByLabelText('계좌 상품 선택'), { target: { value: 'b:01' } })
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('b:01')
})
