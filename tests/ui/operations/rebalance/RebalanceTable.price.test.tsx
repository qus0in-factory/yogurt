import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)

const items: RebalanceItem[] = [
  { code: '005930', name: '삼성전자', targetQuantity: 10, currentQuantity: 2, orderQuantity: 8, side: 'buy' },
  { code: '000660', name: 'SK하이닉스', targetQuantity: 0, currentQuantity: 0, orderQuantity: 0, side: 'none' },
]

function show(prices: Record<string, number>) {
  render(<RebalanceTable items={items} prices={prices} completedCodes={new Set()} onCheck={() => {}} />)
}

it('헤더에 현재가 열이 종목 다음 순서로 있다', () => {
  show({ '005930': 10050 })
  const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
  expect(headers).toEqual(['종목', '현재가', '현재 비중', '목표 비중', '현재 수량', '목표 수량', '주문 수량', '구분', '예상 금액', '매매'])
})

it('현재가 값이 prices 맵과 같고 천 단위 구분으로 표시된다', () => {
  show({ '005930': 10050 })
  const row = screen.getByText('삼성전자').closest('tr')!
  expect(within(row).getByText('10,050원')).toBeInTheDocument()
})

it('가격이 없는 행은 가격 없음을 표시하고 블러가 없다', () => {
  show({})
  const row = screen.getByText('삼성전자').closest('tr')!
  const cells = within(row).getAllByRole('cell')
  expect(cells[1]).toHaveTextContent('가격 없음')
  expect(cells[1].querySelector('.blur-\\[6px\\], .blur')).not.toBeInTheDocument()
  expect(cells[1]).toHaveClass('text-right')
})

it('단위 문구는 glossary 포맷에서 오고 표시 결과는 같다', () => {
  expect(rebalanceText.won(10050)).toBe('10,050원')
  show({ '005930': 10050 })
  expect(screen.getByText('10,050원')).toBeInTheDocument()
})
