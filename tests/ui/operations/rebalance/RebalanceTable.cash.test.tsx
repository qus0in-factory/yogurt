import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { CASH_ITEM_NAME } from '../../../../src/domain/portfolio/item'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)

const items: RebalanceItem[] = [
  { code: '005930', name: '삼성전자', targetQuantity: 10, currentQuantity: 10, orderQuantity: 0, side: 'none' },
]
const prices = { '005930': 10000 }

function cashRow() {
  return screen.getByText(rebalanceText.cashRow).closest('tr')!
}

it('현금 행이 종목 행 다음에 있고 이름이 포트폴리오 현금과 같다', () => {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} cash={50000} weightBase={200000} cashTargetBps={1000} />)
  expect(rebalanceText.cashRow).toBe(CASH_ITEM_NAME)
  const rows = screen.getAllByRole('row')
  expect(rows[rows.length - 1]).toBe(cashRow())
})

it('현재 비중은 (정산 현금−남길 금액)/포트폴리오, 목표 비중은 현금 bps/100이다', () => {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} cash={90000} cashSettled={50000} weightBase={200000} cashTargetBps={1000} />)
  const cells = within(cashRow()).getAllByRole('cell')
  expect(cells[2]).toHaveTextContent('25.00%')
  expect(cells[3]).toHaveTextContent('10.00%')
})

it('현금 행에 매매 버튼·구분 칩이 없고 수량 칸은 비어 있다', () => {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} cash={50000} weightBase={200000} />)
  const row = cashRow()
  expect(within(row).queryByRole('button')).not.toBeInTheDocument()
  expect(within(row).queryByRole('status')).not.toBeInTheDocument()
  const cells = within(row).getAllByRole('cell')
  expect(cells[6]).toHaveTextContent('-')
  expect(cells[7]).toHaveTextContent('-')
  expect(cells[9]).toHaveTextContent('-')
})

it('금액은 가리고 비중은 가리지 않는다', () => {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} cash={50000} weightBase={200000} cashTargetBps={1000} />)
  const cells = within(cashRow()).getAllByRole('cell')
  expect(cells[4].querySelector('[data-sensitive]')).not.toBeNull()
  expect(cells[5].querySelector('[data-sensitive]')).not.toBeNull()
  expect(cells[2].querySelector('[data-sensitive]')).toBeNull()
  expect(cells[3].querySelector('[data-sensitive]')).toBeNull()
})

it('cashSettled가 없으면 0을 쓴다', () => {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} cash={50000} weightBase={200000} />)
  const cells = within(cashRow()).getAllByRole('cell')
  expect(cells[4]).toHaveTextContent('0원')
  expect(cells[2]).toHaveTextContent('0.00%')
})

it('남길 금액은 현금 행에서 빠진다(정산 현금 − 남길 금액, 음수면 0)', () => {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} cash={50000} cashSettled={50000} weightBase={200000} cashTargetBps={1000} keepAmount={40000} />)
  const cells = within(cashRow()).getAllByRole('cell')
  expect(cells[4]).toHaveTextContent('10,000원')
  expect(cells[2]).toHaveTextContent('5.00%')
  expect(cells[5]).toHaveTextContent('20,000원')
  expect(cells[3]).toHaveTextContent('10.00%')
})

it('예제: 전체 1000만(현금 300만·남길 200만)은 현금 행 100만·12.50%, 비중 합 100%', () => {
  const bigItems = [{ code: '005930', name: '삼성전자', targetQuantity: 700, currentQuantity: 700, orderQuantity: 0, side: 'none' as const }]
  render(<RebalanceTable items={bigItems} prices={{ '005930': 10000 }} onCheck={() => {}} cash={3000000} cashSettled={3000000} weightBase={8000000} cashTargetBps={1000} keepAmount={2000000} />)
  const cells = within(cashRow()).getAllByRole('cell')
  expect(cells[4]).toHaveTextContent('1,000,000원')
  expect(cells[2]).toHaveTextContent('12.50%')
  const stockRow = screen.getByText('삼성전자').closest('tr')!
  expect(within(stockRow).getAllByRole('cell')[2]).toHaveTextContent('87.50%')
})
