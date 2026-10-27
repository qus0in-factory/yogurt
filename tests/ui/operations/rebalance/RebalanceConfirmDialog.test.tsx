// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../../src/app/trading/orders-client'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { RebalanceConfirmDialog } from '../../../../src/ui/operations/rebalance/RebalanceConfirmDialog'
import { useMaskStore } from '../../../../src/ui/state/mask-store'

vi.mock('../../../../src/app/trading/orders-client')
const item: RebalanceItem = {
  code: '005930', name: '삼성전자', currentQuantity: 10, targetQuantity: 15, orderQuantity: 5, side: 'buy',
}

describe('RebalanceConfirmDialog', () => {
  beforeEach(() => {
    vi.mocked(client.checkPreOrder).mockResolvedValue({
      code: '005930', side: 'buy', availableQuantity: 8, estimatedAmount: 350000, price: 70000,
    })
    vi.mocked(client.executeOrder).mockResolvedValue({ success: true, orderId: 'ORD-12345' })
  })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it('확인 조회 후 가능 수량을 표시하고 주문 수량은 줄일 수만 있으며 블러되지 않는다', async () => {
    useMaskStore.setState({ masked: true })
    render(<RebalanceConfirmDialog item={item} accountId="acc" productCode="01" price={70000} onClose={vi.fn()} onSuccess={vi.fn()} />)

    expect(await screen.findByText('8 주')).toBeInTheDocument()
    const input = screen.getByLabelText('주문 수량') as HTMLInputElement
    expect(input.value).toBe('5')
    expect(input).not.toHaveClass('blur-[6px]')

    fireEvent.change(input, { target: { value: '10' } })
    expect(input.value).toBe('5')

    fireEvent.change(input, { target: { value: '3' } })
    expect(input.value).toBe('3')
    expect(screen.getByText('210,000원')).toBeInTheDocument()
  })

  it('EGW00215 제한은 재확인 로딩과 안내를 보여 주고 재확인 중 실행을 막는다', async () => {
    vi.useFakeTimers()
    vi.mocked(client.checkPreOrder).mockRejectedValue(Object.assign(new Error('rate'), {
      data: { code: 'ORDER_CHECK_FAILED', stage: 'sellable', kisCode: 'EGW00215', kisMessage: '초당 거래건수 초과' },
    }))
    render(<RebalanceConfirmDialog item={item} accountId="acc" productCode="01" price={70000} onClose={vi.fn()} onSuccess={vi.fn()} />)

    await act(async () => { await Promise.resolve() })
    expect(screen.getByText('다시 확인 중…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '실행' })).toBeDisabled()

    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(screen.getByText('잠시 후 다시 시도하세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 확인' })).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('실패 시 에러 메시지를 표시하고 재시도 시 같은 requestId를 재사용한다', async () => {
    vi.mocked(client.executeOrder).mockResolvedValueOnce({ success: false, message: '잔고가 부족합니다.' })
    render(<RebalanceConfirmDialog item={item} accountId="acc" productCode="01" price={70000} onClose={vi.fn()} onSuccess={vi.fn()} />)

    await screen.findByText('8 주')
    const execBtn = screen.getByRole('button', { name: '실행' })
    await act(async () => { fireEvent.click(execBtn) })

    expect(await screen.findByText('잔고가 부족합니다.')).toBeInTheDocument()
    const firstReqId = vi.mocked(client.executeOrder).mock.calls[0][0].requestId

    await act(async () => { fireEvent.click(execBtn) })
    expect(vi.mocked(client.executeOrder)).toHaveBeenCalledTimes(2)
    const secondReqId = vi.mocked(client.executeOrder).mock.calls[1][0].requestId
    expect(firstReqId).toBe(secondReqId)
  })
})
