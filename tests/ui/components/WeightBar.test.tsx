import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { WeightBar } from '../../../src/ui/components/WeightBar'

afterEach(cleanup)

it('fixes bar and number widths and aligns their right edge', () => {
  render(<WeightBar weight={12.34} />)
  const fill = screen.getByTestId('holding-weight')
  expect(fill).toHaveStyle({ width: '12.34%' })
  expect(fill.parentElement).toHaveClass('h-1.5', 'w-20', 'rounded')
  expect(fill.parentElement?.parentElement).toHaveClass('flex', 'justify-end', 'gap-2')
  expect(screen.getByText('12.34%')).toHaveClass('w-16', 'text-right', 'tabular-nums')
})

it.each([[-25, '0%'], [125, '100%']] as const)('clamps bar width for %s', (weight, width) => {
  render(<WeightBar weight={weight} />)
  expect(screen.getByTestId('holding-weight')).toHaveStyle({ width })
})
