import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)

const items: RebalanceItem[] = [
  { code: '005930', name: '삼성전자', targetQuantity: 10, currentQuantity: 10, orderQuantity: 0, side: 'none' },
  { code: '000660', name: 'SK하이닉스', targetQuantity: 0, currentQuantity: 5, orderQuantity: 5, side: 'sell' },
]
const prices = { '005930': 10000, '000660': 20000 }
const targetBps = { '005930': 2500 }
const weightBase = 10 * 10000 + 5 * 20000 + 100000

function show() {
  render(<RebalanceTable items={items} prices={prices} onCheck={() => {}} targetBps={targetBps} weightBase={weightBase} />)
}

it('열 순서가 종목·현재가·현재비중·목표비중·수량·주문·구분·금액·매매다', () => {
  show()
  expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['종목', '현재가', '현재 비중', '목표 비중', '현재 수량', '목표 수량', '주문 수량', '구분', '예상 금액', '매매'])
})

it('목표 비중은 bps/100, 목표 없는 보유는 0%다', () => {
  show()
  expect(screen.getByText('25.00%')).toBeInTheDocument()
  expect(screen.getAllByText('0.00%').length).toBeGreaterThanOrEqual(1)
})

it('현재 비중은 평가액/포트폴리오 금액이고 비중 셀에 블러가 없다', () => {
  show()
  const row = screen.getByText('삼성전자').closest('tr')!
  const cells = within(row).getAllByRole('cell')
  expect(cells[2]).toHaveTextContent('%')
  expect(cells[2].querySelector('.blur-\\[6px\\], .blur')).not.toBeInTheDocument()
  expect(cells[2]).toHaveClass('text-right')
  expect(cells[3]).toHaveTextContent('25.00%')
  expect(cells[3].querySelector('.blur-\\[6px\\], .blur')).not.toBeInTheDocument()
})

it('전체 금액 0이면 현재 비중은 0%다', () => {
  render(<RebalanceTable items={items.slice(0, 1)} prices={prices} onCheck={() => {}} targetBps={targetBps} weightBase={0} />)
  const row = screen.getByText('삼성전자').closest('tr')!
  expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('0.00%')
})
