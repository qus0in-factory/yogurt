import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)

const items: RebalanceItem[] = [
  { code: '005930', name: '삼성전자', targetQuantity: 10, currentQuantity: 2, orderQuantity: 8, side: 'buy' },
]

function show() {
  render(<RebalanceTable items={items} prices={{ '005930': 10000 }} completedCodes={new Set()} onCheck={() => {}} />)
}

it('매매 버튼에 거래 아이콘이 있고 텍스트 매매가 없다', () => {
  show()
  const button = screen.getByRole('button', { name: '삼성전자 매매' })
  expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(button).not.toHaveTextContent('매매')
  expect(button).toHaveClass('min-h-11', 'min-w-11')
})

it('가격 없는 행의 매매 버튼은 비활성화 상태를 유지한다', () => {
  render(<RebalanceTable items={items} prices={{}} completedCodes={new Set()} onCheck={() => {}} />)
  const button = screen.getByRole('button', { name: '삼성전자 가격 없음' })
  expect(button).toBeDisabled()
  expect(button).toHaveClass('min-h-11', 'min-w-11')
})
