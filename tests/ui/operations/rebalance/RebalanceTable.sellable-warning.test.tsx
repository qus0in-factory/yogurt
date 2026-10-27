// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)

const item = (sellableWarning: 'missing' | 'zero'): RebalanceItem => ({
  code: 'A', name: 'A', targetQuantity: 0, currentQuantity: 10, orderQuantity: 0, side: 'none', sellableWarning,
})

it.each([
  ['missing', rebalanceText.sellableWarning.missing],
  ['zero', rebalanceText.sellableWarning.zero],
] as const)('%s 매도 차단은 행 아이콘과 툴팁으로 표시한다', (warning, message) => {
  render(<RebalanceTable items={[item(warning)]} prices={{ A: 100 }} completedCodes={new Set()} onCheck={() => {}} />)
  const row = screen.getAllByText('A')[0].closest('tr')!
  expect(row.querySelector('svg')).not.toBeNull()
  expect(within(row).getByRole('button', { name: message })).toBeInTheDocument()
  expect(within(row).queryByText(message)).not.toBeInTheDocument()
})
