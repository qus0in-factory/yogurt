import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../../src/app/trading/orders-client'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceConfirmDialog } from '../../../../src/ui/operations/rebalance/RebalanceConfirmDialog'

vi.mock('../../../../src/app/trading/orders-client')

const mockItem: RebalanceItem = {
  code: '005930', name: '삼성전자', targetQuantity: 10, currentQuantity: 2, orderQuantity: 8, side: 'buy',
}

beforeEach(() => {
  vi.mocked(client.checkPreOrder).mockResolvedValue({
    code: '005930', side: 'buy', availableQuantity: 10, estimatedAmount: 700000, price: 70000,
  })
})
afterEach(cleanup)

describe('RebalanceConfirmDialog MARKET_CLOSED 응답', () => {
  it('실행 결과가 MARKET_CLOSED 면 사유와 다음 개장 시각을 alert로 표시한다', async () => {
    vi.mocked(client.executeOrder).mockResolvedValue({
      success: false, failureCode: 'MARKET_CLOSED', reason: 'holiday', nextOpenAt: '2026-10-29T00:00:00.000Z',
    })
    render(
      <RebalanceConfirmDialog
        item={mockItem} accountId="acc-1" productCode="01" price={70000} requestId="req-market-test"
        onClose={vi.fn()} onSuccess={vi.fn()}
      />,
    )
    const executeBtn = await screen.findByRole('button', { name: '실행' })
    fireEvent.click(executeBtn)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('휴장일')
    expect(alert).toHaveTextContent('2026.10.29 09:00 (한국 시간)')
  })
})
