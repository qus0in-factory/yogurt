import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { StatGrid } from '../../../src/ui/components/StatGrid'

it('renders each statistic as a label and value pair', () => {
  render(<StatGrid items={[{ label: '총액', value: '10원' }]} />)
  expect(screen.getByText('총액').tagName).toBe('DT')
  expect(screen.getByText('10원').tagName).toBe('DD')
})
