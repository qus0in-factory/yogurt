import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { WeightBar } from '../../../src/ui/components/WeightBar'

afterEach(cleanup)

it('fixes bar and number widths and aligns their right edge', () => {
  render(<WeightBar weight={12.34} />)
  const fill = screen.getByTestId('holding-weight')
  expect(fill).toHaveStyle({ width: '12.34%' })
  expect(fill.parentElement).toHaveClass('h-1.5', 'md:w-20', 'rounded')
  expect(fill.parentElement?.parentElement).toHaveClass('flex', 'justify-end', 'gap-2')
  expect(screen.getByText('12.34%')).toHaveClass('md:w-16', 'text-right', 'tabular-nums')
})

it.each([
  [-25, '0%'], [0, '0%'], [50, '50%'], [100, '100%'], [120, '100%'], [125, '100%'],
] as const)('clamps bar width for %s', (weight, width) => {
  render(<WeightBar weight={weight} />)
  expect(screen.getByTestId('holding-weight')).toHaveStyle({ width })
})

it('lets the bar shrink on a narrow parent instead of overflowing', () => {
  render(<WeightBar weight={50} />)
  const fill = screen.getByTestId('holding-weight')
  const track = fill.parentElement
  expect(track?.parentElement).toHaveClass('min-w-0', 'max-w-full', 'flex-wrap')
  expect(track).toHaveClass('min-w-0', 'max-w-full')
  expect(track).not.toHaveClass('w-20', 'shrink-0')
  expect(fill).toHaveClass('max-w-full')
  expect(screen.getByText('50.00%')).not.toHaveClass('shrink-0')
})
