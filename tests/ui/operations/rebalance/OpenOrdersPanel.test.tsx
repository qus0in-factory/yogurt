// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelOpenOrder, fetchOpenOrders } from '../../../../src/app/trading/open-orders-client'
import { OpenOrdersPanel } from '../../../../src/ui/operations/rebalance/OpenOrdersPanel'

vi.mock('../../../../src/app/trading/open-orders-client', () => ({ fetchOpenOrders: vi.fn(), cancelOpenOrder: vi.fn() }))

const order = { orderId: 'O-1', orgNo: '0000001', code: '005930', name: '삼성전자', side: 'buy' as const, orderQty: 10, filledQty: 3, remainingQty: 7, price: 70000, orderedAt: '2026-10-27T01:00:00Z' }

function show(onCancelled = vi.fn()) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><OpenOrdersPanel target={{ accountId: 'a1', productCode: '01' }} onCancelled={onCancelled} /></QueryClientProvider>)
  return { onCancelled }
}

beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchOpenOrders).mockResolvedValue([order]) })
afterEach(cleanup)

describe('미체결 주문 목록과 취소', () => {
  it('목록에 종목·매수/매도·주문/체결/잔량·가격이 보인다', async () => {
    show()
    expect(await screen.findByText('미체결 주문')).toBeInTheDocument()
    expect(screen.getByText('삼성전자')).toBeInTheDocument()
    expect(screen.getByText(/매수 · 주문 10주 · 체결 3주 · 잔량 7주/)).toBeInTheDocument()
    expect(screen.getByText(/70,000원/)).toBeInTheDocument()
    expect(vi.mocked(fetchOpenOrders)).toHaveBeenCalledWith('a1', '01')
  })

  it('없으면 숨긴다', async () => {
    vi.mocked(fetchOpenOrders).mockResolvedValue([])
    show()
    await vi.waitFor(() => expect(vi.mocked(fetchOpenOrders)).toHaveBeenCalled())
    expect(screen.queryByText('미체결 주문')).not.toBeInTheDocument()
  })

  it('확인 후에만 취소 호출을 보낸다', async () => {
    vi.mocked(cancelOpenOrder).mockResolvedValue({ ok: true, cancelOrderId: 'C-1' })
    show()
    fireEvent.click(await screen.findByRole('button', { name: '삼성전자 취소' }))
    expect(await screen.findByRole('dialog', { name: '주문 취소 확인' })).toBeInTheDocument()
    expect(screen.getByText('삼성전자 7주를 취소합니다')).toBeInTheDocument()
    expect(vi.mocked(cancelOpenOrder)).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '취소하기' }))
    await vi.waitFor(() => expect(vi.mocked(cancelOpenOrder)).toHaveBeenCalledTimes(1))
    expect(vi.mocked(cancelOpenOrder)).toHaveBeenCalledWith('a1', '01', 'O-1', '0000001')
  })

  it('진행 중 중복 클릭을 막는다', async () => {
    let release!: () => void
    vi.mocked(cancelOpenOrder).mockReturnValue(new Promise((r) => { release = () => r({ ok: true, cancelOrderId: 'C-1' }) }))
    show()
    fireEvent.click(await screen.findByRole('button', { name: '삼성전자 취소' }))
    fireEvent.click(screen.getByRole('button', { name: '취소하기' }))
    fireEvent.click(screen.getByRole('button', { name: '취소하기' }))
    expect(screen.getByRole('button', { name: '취소하기' })).toBeDisabled(); release()
    await vi.waitFor(() => expect(vi.mocked(cancelOpenOrder)).toHaveBeenCalledTimes(1))
  })

  it('실패하면 KIS 메시지를 보여주고 재시도하지 않는다', async () => {
    vi.mocked(cancelOpenOrder).mockResolvedValue({ ok: false, code: 'E', message: '잔고 부족' })
    show()
    fireEvent.click(await screen.findByRole('button', { name: '삼성전자 취소' }))
    fireEvent.click(screen.getByRole('button', { name: '취소하기' }))
    expect(await screen.findByText('잔고 부족')).toBeInTheDocument()
    expect(vi.mocked(cancelOpenOrder)).toHaveBeenCalledTimes(1)
  })

  it('성공하면 재조회하고 기록 정리를 알린다', async () => {
    vi.mocked(cancelOpenOrder).mockResolvedValue({ ok: true, cancelOrderId: 'C-1' })
    const { onCancelled } = show()
    fireEvent.click(await screen.findByRole('button', { name: '삼성전자 취소' }))
    fireEvent.click(screen.getByRole('button', { name: '취소하기' }))
    await vi.waitFor(() => expect(vi.mocked(fetchOpenOrders)).toHaveBeenCalledTimes(2))
    expect(onCancelled).toHaveBeenCalledWith('a1:01:005930:buy')
  })
})
