// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import * as progress from '../../../../src/app/accounts/isa-progress-diff'
import { RebalanceIsaTargets } from '../../../../src/ui/operations/rebalance/RebalanceIsaTargets'
import { useMaskStore } from '../../../../src/ui/state/mask-store'
const plan = { startDate: '2024-11-01', minTargetAmountWon: 36_000_000, maxTargetAmountWon: 72_000_000 }
const month = progress.calculateCurrentMonthTargets(plan.startDate, '2026-10-25', 36_000_000, 72_000_000, 25_200_000, '만', '목표 없음', '시작일 필요', '시작 전')
beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-25T00:00:00+09:00').getTime()))
afterEach(() => { cleanup(); vi.restoreAllMocks(); useMaskStore.setState({ masked: false }) })
function show(value: typeof plan | null = plan) {
  render(<RebalanceIsaTargets totalAmount={25_200_000} plan={value} />)
  const button = screen.getByRole('button', { name: /목표 대비 보기/ })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'true')
}
it('계획 전체 목표가 아닌 이번 달 목표 세 행을 표시한다', () => {
  show()
  for (const label of ['최소(이번 달) 대비', '중간(이번 달) 대비', '최대(이번 달) 대비']) expect(screen.getByText(label)).toBeInTheDocument()
  for (const value of ['2,400만원', '3,600만원', '4,800만원']) expect(screen.getByText(value)).toBeInTheDocument()
  expect(screen.queryByText('7,200만원')).not.toBeInTheDocument()
})
it('중간 목표는 직접 평균내지 않고 month.midTargetManwon을 쓴다', () => {
  vi.spyOn(progress, 'calculateCurrentMonthTargets').mockReturnValue({ ...month, midTargetManwon: 3333, midDiffText: '+7만' })
  show()
  expect(screen.getByText('3,333만원')).toBeInTheDocument()
  expect(screen.getByText('+7만')).toBeInTheDocument()
  expect(screen.queryByText('3,600만원')).not.toBeInTheDocument()
})
it('이번 달 목표가 없으면 안내 한 줄만 표시한다', () => {
  show(null)
  expect(screen.getByText('이번 달 목표 없음')).toBeInTheDocument()
  expect(screen.queryByText('최소(이번 달) 대비')).not.toBeInTheDocument()
  expect(document.querySelectorAll('[data-sensitive]')).toHaveLength(0)
})
it('차이 텍스트는 기존 month.diffText와 같고 달성률은 월 목표 대비다', () => {
  show()
  for (const text of [month.minDiffText, month.midDiffText, month.maxDiffText]) expect(screen.getByText(text)).toBeInTheDocument()
  for (const rate of ['105.0%', '70.0%', '52.5%']) expect(screen.getByText(rate)).toBeInTheDocument()
})
it('목표·차이 금액만 가리고 라벨과 달성률은 가리지 않는다', () => {
  show()
  act(() => useMaskStore.setState({ masked: true }))
  expect(screen.getByText('2,400만원')).toHaveClass('blur-[6px]')
  expect(screen.getByText(month.minDiffText)).toHaveClass('blur-[6px]')
  expect(screen.getByText('최소(이번 달) 대비')).not.toHaveClass('blur-[6px]')
  expect(screen.getByText('105.0%')).not.toHaveClass('blur-[6px]')
})
