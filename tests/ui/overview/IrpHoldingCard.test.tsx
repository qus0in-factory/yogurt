import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { IrpHoldingCard } from '../../../src/ui/overview/IrpHoldingCard'
import type { IrpHolding } from '../../../src/ui/overview/IrpHoldingRow'
import { typeScale } from '../../../src/ui/styles/type-scale'
import { holding } from './fixtures'

afterEach(cleanup)
function show(overrides: Partial<IrpHolding> = {}) {
  render(<ul><IrpHoldingCard holding={{ ...holding, weight: 75, ...overrides }} /></ul>)
}
it('모바일 카드는 종목명과 코드 뒤에 두 열로 수치 정보를 표시한다', () => {
  show()
  const card = screen.getByRole('listitem')
  expect(card.querySelector('dl')).toHaveClass('grid', 'grid-cols-2', 'gap-4')
  const name = screen.getByText('삼성전자')
  const code = screen.getByText('069500')
  expect(code).toHaveClass('font-mono', 'text-xs', 'text-stone-500')
  expect(code.nextElementSibling).toBe(name)
  expect(name).toHaveClass('font-medium')
  expect(name.parentElement).toHaveClass('gap-2')
  expect(screen.getByText('12,000원')).toHaveClass('text-right', ...typeScale.number.split(' '))
  expect(screen.getByText('2')).toHaveClass('text-right', ...typeScale.number.split(' '))
})
it('빈 종목코드는 요소를 만들지 않는다', () => {
  show({ code: '' })
  const wrapper = screen.getByText('삼성전자').parentElement
  expect(wrapper?.children).toHaveLength(1)
  expect(wrapper?.querySelector('.font-mono')).toBeNull()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
it.each([
  [2000, 20, '+2,000원', '+20%', 'text-red-600'],
  [-2000, -20, '-2,000원', '-20%', 'text-blue-600'],
  [0, 0, '0원', '0%', 'text-stone-500'],
] as const)('모바일 손익 %s의 부호와 색상을 적용한다', (profitLoss, profitLossRate, won, rate, color) => {
  show({ profitLoss, profitLossRate })
  expect(screen.getByText(won)).toHaveClass(color, 'tabular-nums')
  expect(screen.getByText(rate)).toHaveClass(color, 'tabular-nums')
})
it('모바일 비중은 소수 두 자리와 막대로 표시한다', () => {
  show()
  expect(screen.getByText('75.00%')).toBeInTheDocument()
  expect(screen.getByTestId('holding-weight')).toHaveStyle({ width: '75%' })
})
it('위험 토글은 전파를 막고 콜백을 호출한다', () => {
  const onToggle = vi.fn()
  const parent = vi.fn()
  render(<ul onClick={parent}><IrpHoldingCard holding={{ ...holding, weight: 75 }} onToggle={onToggle} /></ul>)
  const button = screen.getByRole('button', { name: '위험' })
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(button).toHaveClass('gap-2', 'text-amber-700')
  fireEvent.click(button)
  expect(onToggle).toHaveBeenCalledOnce()
  expect(parent).not.toHaveBeenCalled()
})
