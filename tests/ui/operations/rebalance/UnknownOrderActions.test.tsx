import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { UnknownOrderActions } from '../../../../src/ui/operations/rebalance/UnknownOrderActions'
it('확인 후에만 로컬 기록을 지운다', () => {
  const clear = vi.fn()
  render(<UnknownOrderActions onClear={clear} />)
  fireEvent.click(screen.getByRole('button', { name: '주문 기록 지우기' }))
  expect(clear).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '기록만 지우기' }))
  expect(clear).toHaveBeenCalledTimes(1)
})
