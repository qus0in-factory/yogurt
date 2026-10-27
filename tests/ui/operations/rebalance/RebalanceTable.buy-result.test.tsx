// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceTable } from '../../../../src/ui/operations/rebalance/RebalanceTable'

afterEach(cleanup)
const item: RebalanceItem = { code: '005930', name: '삼성전자', targetQuantity: 20, currentQuantity: 10, orderQuantity: 10, side: 'buy' }

it('매수 filled 결과를 주문 기록이 지워진 뒤에도 결과 칩으로 표시하고 수량은 유지한다', () => {
  render(<RebalanceTable items={[item]} prices={{ '005930': 10_000 }} onCheck={() => {}} fillEventsByKey={{ '005930:buy': 'filled' }} />)
  const row = screen.getByText('삼성전자').closest('tr')!
  expect(within(row).getByRole('status', { name: '체결' })).toBeInTheDocument()
  expect(within(row).getAllByRole('cell')[6]).toHaveTextContent('10')
  expect(within(row).getAllByRole('cell')[5]).toHaveTextContent('20')
})
