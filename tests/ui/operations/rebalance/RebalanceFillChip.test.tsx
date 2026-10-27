// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { RebalanceFillChip } from '../../../../src/ui/operations/rebalance/RebalanceFillChip'

afterEach(cleanup)

describe('RebalanceFillChip', () => {
  const statuses = ['filled', 'closed_partial', 'partial', 'open', 'cancelled', 'unknown', 'noOrderId', 'not_found'] as const

  it.each(statuses)('%s 상태는 아이콘 1개·색상 칩으로, 문구는 aria·툴팁으로만 둔다', (status) => {
    render(<RebalanceFillChip status={status} />)
    const label = rebalanceText.fillStatus[status]
    const chip = screen.getByRole('status', { name: label })
    expect(chip.querySelector('svg')).not.toBeNull()
    expect(chip).not.toHaveTextContent(label)
    expect(within(chip).getByRole('button', { name: label })).toBeInTheDocument()
  })

  it('상태별 아이콘은 모두 다르다', () => {
    const marks = statuses.map((status) => {
      cleanup()
      render(<RebalanceFillChip status={status} />)
      const svg = screen.getByRole('status', { name: rebalanceText.fillStatus[status] }).querySelector(':scope > svg')
      expect(svg).not.toBeNull()
      return svg!.outerHTML
    })
    expect(new Set(marks).size).toBe(statuses.length)
  })
})
