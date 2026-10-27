// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)

const item: RebalanceItem = { code: '005930', name: '삼성전자', targetQuantity: 400, currentQuantity: 0, orderQuantity: 400, side: 'buy' }

function show(buyLimit: number) {
  render(<RebalanceTable items={[item]} prices={{ '005930': 10000 }} buyGateOpen buyLimit={buyLimit} onCheck={() => {}} />)
  return within(screen.getByText('삼성전자').closest('tr')!).getAllByRole('cell')[6]
}

describe('주문 수량 셀 매수 한도 압축 표시', () => {
  it('한도가 걸리면 `400 (312)` 한 줄과 aria·툴팁을 보여준다', () => {
    const cell = show(3_120_000)
    expect(cell).toHaveTextContent('400')
    expect(cell).toHaveTextContent('(312)')
    expect(within(cell).getByRole('img', { name: '매수 한도 312주' })).toBeInTheDocument()
    expect(within(cell).getByRole('button', { name: '매수 한도 312주' })).toBeInTheDocument()
  })

  it('한도가 없으면 숫자만 보여준다', () => {
    const cell = show(99_000_000)
    expect(cell).toHaveTextContent('400')
    expect(cell).not.toHaveTextContent('(')
    expect(within(cell).queryByRole('img')).not.toBeInTheDocument()
  })

  it('한도가 0이면 `400 (0)`을 보여준다', () => {
    const cell = show(0)
    expect(cell).toHaveTextContent('400 (0)')
    expect(within(cell).getByRole('img', { name: '매수 한도 0주' })).toBeInTheDocument()
  })
})
