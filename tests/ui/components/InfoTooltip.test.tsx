import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { InfoTooltip } from '../../../src/ui/components/InfoTooltip'

afterEach(cleanup)
function show() {
  render(<InfoTooltip label="담보비율 기준">툴팁 내용</InfoTooltip>)
  return screen.getByRole('button', { name: '담보비율 기준' })
}
it('hover하면 툴팁과 aria-describedby를 표시한다', () => {
  const button = show()
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  fireEvent.mouseEnter(button)
  const tooltip = screen.getByRole('tooltip')
  expect(tooltip).toHaveTextContent('툴팁 내용')
  expect(button).toHaveAttribute('aria-describedby', tooltip.id)
  expect(button.querySelector('svg')).toHaveClass('h-3.5', 'w-3.5', 'text-stone-400')
})
it('focus하면 툴팁을 표시하고 Esc로 닫는다', () => {
  const button = show()
  fireEvent.focus(button)
  expect(screen.getByRole('tooltip')).toBeInTheDocument()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})
it('클릭으로 토글하고 바깥 클릭으로 닫는다', () => {
  const button = show()
  fireEvent.click(button)
  expect(screen.getByRole('tooltip')).toBeInTheDocument()
  fireEvent.mouseDown(document.body)
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  fireEvent.click(button)
  fireEvent.click(button)
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})
