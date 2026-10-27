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

describe('RebalanceConfirmDialog 주문 유형 표시 및 거부 규칙', () => {
  it('확인 창에 주문 유형(최유리 IOC)과 참고용 예상 가격을 표시한다', async () => {
    render(<RebalanceConfirmDialog item={mockItem} accountId="a1" productCode="01" price={70000} requestId="req-1" onClose={vi.fn()} onSuccess={vi.fn()} />)
    expect(await screen.findByText('주문 유형')).toBeInTheDocument()
    expect(screen.getByText('최유리 IOC')).toBeInTheDocument()
    expect(screen.getByText('최유리(예상가 70,000원)')).toBeInTheDocument()
  })

  it.each([
    ['409 처리 중', 'ORDER_IN_PROGRESS'],
    ['500 장애', 'ORDER_FAILED'],
    ['502/503 일시 장애', 'ORDER_UNAVAILABLE'],
    ['202 결과 불명', 'ORDER_UNKNOWN'],
  ])('%s 발생 시 onUnknown이 호출된다', async (_, failureCode) => {
    vi.mocked(client.executeOrder).mockResolvedValue({ success: false, failureCode, message: '확인 필요' })
    const onUnknown = vi.fn(), onFailure = vi.fn()
    render(<RebalanceConfirmDialog item={mockItem} accountId="a1" productCode="01" price={70000} requestId="req-1" onClose={vi.fn()} onSuccess={vi.fn()} onUnknown={onUnknown} onFailure={onFailure} />)

    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onUnknown).toHaveBeenCalledWith('005930')
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('확정 거부 코드(ORDER_QUANTITY_EXCEEDED) 발생 시 onFailure가 호출된다', async () => {
    vi.mocked(client.executeOrder).mockResolvedValue({ success: false, failureCode: 'ORDER_QUANTITY_EXCEEDED', message: '주문 수량 초과' })
    const onUnknown = vi.fn(), onFailure = vi.fn()
    render(<RebalanceConfirmDialog item={mockItem} accountId="a1" productCode="01" price={70000} requestId="req-1" onClose={vi.fn()} onSuccess={vi.fn()} onUnknown={onUnknown} onFailure={onFailure} />)

    fireEvent.click(await screen.findByRole('button', { name: '실행' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onFailure).toHaveBeenCalledWith('005930')
    expect(onUnknown).not.toHaveBeenCalled()
  })
})
