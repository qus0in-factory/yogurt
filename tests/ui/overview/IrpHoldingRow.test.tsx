import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { IrpHoldingRow, type IrpHolding } from '../../../src/ui/overview/IrpHoldingRow'
import { holding } from './fixtures'

afterEach(cleanup)
function show(overrides: Partial<IrpHolding> = {}) {
  render(<table><tbody><IrpHoldingRow holding={{ ...holding, weight: 12.34, ...overrides }} /></tbody></table>)
}
it('종목코드를 이름 앞에 고정폭 회색 텍스트로 표시한다', () => {
  show()
  const code = screen.getByText('069500')
  const name = screen.getByText('삼성전자')
  expect(code).toHaveClass('font-mono', 'text-xs', 'text-stone-500')
  expect(name).toHaveClass('font-medium')
  expect(code.nextElementSibling).toBe(name)
  expect(name.parentElement).toHaveClass('gap-2')
})
it('종목코드가 빈 문자열이면 코드 요소를 생략하고 이름만 표시한다', () => {
  show({ code: '' })
  const wrapper = screen.getByText('삼성전자').parentElement
  expect(wrapper).toHaveClass('gap-2')
  expect(wrapper?.children).toHaveLength(1)
  expect(wrapper?.querySelector('.font-mono')).toBeNull()
})
it.each([
  [2000, 20, '+2,000원', '+20%', 'text-red-600'],
  [-2000, -20, '-2,000원', '-20%', 'text-blue-600'],
  [0, 0, '0원', '0%', 'text-stone-500'],
] as const)('손익이 %s이면 부호와 색상을 적용한다', (profitLoss, profitLossRate, won, rate, color) => {
  show({ profitLoss, profitLossRate })
  expect(screen.getByText(won)).toHaveClass(color)
  expect(screen.getByText(rate)).toHaveClass(color)
})
it('행은 세로 여백과 열 간격을 두고 숫자를 오른쪽에 정렬한다', () => {
  show()
  for (const cell of screen.getAllByRole('cell')) {
    expect(cell).toHaveClass('py-3', 'pr-4', 'text-right', 'tabular-nums')
  }
})
it('비중은 소수 두 자리와 동일한 너비의 막대로 표시한다', () => {
  show()
  expect(screen.getByText('12.34%')).toBeInTheDocument()
  const bar = screen.getByTestId('holding-weight')
  expect(bar).toHaveClass('bg-primary-400')
  expect(bar).toHaveStyle({ width: '12.34%' })
  expect(bar.parentElement).toHaveClass('bg-primary-100')
})
