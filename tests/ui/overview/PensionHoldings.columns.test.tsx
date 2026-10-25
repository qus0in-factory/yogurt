import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PensionHoldings } from '../../../src/ui/overview/PensionHoldings'
import { balance } from './fixtures'

afterEach(cleanup)

it('연금저축 표의 헤더·종목·현금 열과 비중 셀을 맞춘다', () => {
  render(<PensionHoldings summary={balance.summary} holdings={balance.holdings} wide />)
  const table = within(screen.getByRole('region', { name: '예수금·주식' })).getByRole('table')
  const headers = table.querySelectorAll('thead th').length
  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'))
  expect(headers).toBe(6)
  expect(rows).toHaveLength(2)
  expect(rows.every((row) => row.cells.length === headers)).toBe(true)
  expect(rows[0].cells[5].className).toBe(rows[1].cells[5].className)
})
