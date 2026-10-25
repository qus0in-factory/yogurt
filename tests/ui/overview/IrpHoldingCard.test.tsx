import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { IrpHoldingCard } from '../../../src/ui/overview/IrpHoldingCard'
import type { IrpHolding } from '../../../src/ui/overview/IrpHoldingRow'
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
  expect(screen.getByText('12,000원')).toHaveClass('text-right', 'tabular-nums')
  expect(screen.getByText('2')).toHaveClass('text-right', 'tabular-nums')
})
it('빈 종목코드는 요소를 만들지 않는다', () => {
  show({ code: '' })
  const wrapper = screen.getByText('삼성전자').parentElement
  expect(wrapper?.children).toHaveLength(1)
  expect(wrapper?.querySelector('.font-mono')).toBeNull()
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
