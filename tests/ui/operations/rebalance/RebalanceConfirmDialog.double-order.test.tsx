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

describe('RebalanceConfirmDialog 이중 주문 방지', () => {
  it('실행 중에는 Esc, 배경 클릭, 취소로 닫히지 않고 진행 중 표시를 띄운다', async () => {
    let resolveOrder!: (val: unknown) => void
    const orderPromise = new Promise((resolve) => { resolveOrder = resolve })
    vi.mocked(client.executeOrder).mockReturnValue(orderPromise as never)

    const onClose = vi.fn()
    render(<RebalanceConfirmDialog item={mockItem} accountId="a1" productCode="01" price={70000} requestId="req-123" onClose={onClose} onSuccess={vi.fn()} />)

    const executeBtn = await screen.findByRole('button', { name: '실행' })
    fireEvent.click(executeBtn)

    const cancelBtn = screen.getByRole('button', { name: '취소' })
    expect(cancelBtn).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('실행 중…')

    fireEvent.click(cancelBtn)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('dialog-backdrop'))
    expect(onClose).not.toHaveBeenCalled()

    resolveOrder({ success: true, orderId: 'ORD-1' })
  })

  it('네트워크 오류 발생 시 onUnknown이 호출되고 결과 불명으로 처리된다', async () => {
    vi.mocked(client.executeOrder).mockRejectedValue(new Error('Network disconnected'))
    const onUnknown = vi.fn(), onFailure = vi.fn()
    render(<RebalanceConfirmDialog item={mockItem} accountId="a1" productCode="01" price={70000} requestId="req-1" onClose={vi.fn()} onSuccess={vi.fn()} onUnknown={onUnknown} onFailure={onFailure} />)

    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('주문 상태를 알 수 없습니다')
    expect(onUnknown).toHaveBeenCalledWith('005930')
    expect(onFailure).not.toHaveBeenCalled()
  })
})
