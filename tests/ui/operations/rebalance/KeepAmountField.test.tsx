// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { KeepAmountField } from '../../../../src/ui/operations/rebalance/KeepAmountField'

afterEach(cleanup)

it('입력만 바꾸면 저장하지 않고, 저장 클릭 시 한 번만 호출한다', () => {
  const onSave = vi.fn()
  const { rerender } = render(<KeepAmountField savedAmount={100_000} onSave={onSave} />)
  fireEvent.change(screen.getByLabelText(rebalanceText.keepAmount), { target: { value: '150000' } })
  expect(onSave).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: rebalanceText.keepAmountSave }))
  expect(onSave).toHaveBeenCalledTimes(1)
  expect(onSave).toHaveBeenCalledWith(150_000)

  rerender(<KeepAmountField savedAmount={100_000} onSave={onSave} isSaving />)
  expect(screen.getByRole('button', { name: rebalanceText.keepAmountSave })).toBeDisabled()
})

it('저장 실패 시 오류 문구를 표시한다', () => {
  render(<KeepAmountField savedAmount={0} onSave={vi.fn()} isError />)
  expect(screen.getByRole('alert')).toHaveTextContent(rebalanceText.keepAmountError)
})
