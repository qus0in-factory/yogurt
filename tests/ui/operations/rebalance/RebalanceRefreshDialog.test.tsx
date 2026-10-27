// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { RebalanceRefreshDialog } from '../../../../src/ui/operations/rebalance/RebalanceRefreshDialog'

describe('RebalanceRefreshDialog', () => {
  it('미확인 건수가 0건이면 기본 문구, 1건 이상이면 건수를 표시한다', () => {
    const { rerender } = render(<RebalanceRefreshDialog open={true} unconfirmedCount={0} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(rebalanceText.action.refreshPlanConfirm)).toBeInTheDocument()

    rerender(<RebalanceRefreshDialog open={true} unconfirmedCount={3} onConfirm={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText(rebalanceText.action.refreshPlanConfirmWithCount(3))).toBeInTheDocument()
  })

  it('새로고침 클릭 시 onConfirm 호출, 취소 클릭 시 onClose를 호출한다', () => {
    const onConfirm = vi.fn(), onClose = vi.fn()
    render(<RebalanceRefreshDialog open={true} unconfirmedCount={1} onConfirm={onConfirm} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: rebalanceText.action.cancel }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: rebalanceText.action.refresh }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('버튼은 최소 44px 높이(min-h-11)를 가진다', () => {
    render(<RebalanceRefreshDialog open={true} unconfirmedCount={0} onConfirm={vi.fn()} onClose={vi.fn()} />)
    const cancelBtn = screen.getByRole('button', { name: rebalanceText.action.cancel })
    const confirmBtn = screen.getByRole('button', { name: rebalanceText.action.refresh })
    expect(cancelBtn).toHaveClass('min-h-11')
    expect(confirmBtn).toHaveClass('min-h-11')
  })
})
