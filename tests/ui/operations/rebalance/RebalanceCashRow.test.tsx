// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'
import { RebalanceCashRow } from '../../../../src/ui/operations/rebalance/RebalanceCashRow'

afterEach(cleanup)

it('현금 행 금액은 정산 현금 − 남길 금액이고 캡션을 붙이지 않는다', () => {
  render(<table><tbody>
    <RebalanceCashRow cash={500_000} cashSettled={500_000} cashTargetBps={7000} weightBase={7_000_000} keepAmount={300_000} cell="" />
  </tbody></table>)
  const row = screen.getByText(rebalanceText.cashRow).closest('tr')!
  const cells = within(row).getAllByRole('cell')
  expect(cells[4]).toHaveTextContent('200,000원')
  expect(cells[5]).toHaveTextContent('4,900,000원')
  expect(cells[2]).toHaveTextContent('2.86%')
  expect(cells[3]).toHaveTextContent('70.00%')
  expect(within(row).queryByText(/남길 금액 포함/)).not.toBeInTheDocument()
})

it('정산 현금이 남길 금액보다 적으면 0원을 보인다', () => {
  render(<table><tbody>
    <RebalanceCashRow cash={100_000} cashSettled={100_000} weightBase={7_000_000} keepAmount={300_000} cell="" />
  </tbody></table>)
  const cells = within(screen.getByText(rebalanceText.cashRow).closest('tr')!).getAllByRole('cell')
  expect(cells[4]).toHaveTextContent('0원')
  expect(cells[2]).toHaveTextContent('0.00%')
})
