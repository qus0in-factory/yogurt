import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PensionHoldings } from '../../../src/ui/overview/PensionHoldings'
import { balance } from './fixtures'

afterEach(cleanup)

it('예수금(D+2)을 현금 행과 비중에 쓰고 D+0 출금 가능을 보조 표기한다', () => {
  render(<PensionHoldings summary={{ ...balance.summary, cash: 1000, cashD2: 5000 }} holdings={balance.holdings} wide />)
  const region = within(screen.getByRole('region', { name: '예수금·주식' }))
  expect(region.getByText('예수금(D+2)')).toBeInTheDocument()
  expect(region.getAllByText('5,000원')).toHaveLength(2)
  expect(region.getAllByText('출금 가능(D+0) 1,000원')).toHaveLength(2)
  expect(region.getByText('70.59%')).toBeInTheDocument()
  expect(region.getByText('29.41%')).toBeInTheDocument()
})

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
