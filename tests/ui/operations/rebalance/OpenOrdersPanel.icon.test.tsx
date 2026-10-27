// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelOpenOrder, fetchOpenOrders } from '../../../../src/app/trading/open-orders-client'
import { OpenOrdersPanel } from '../../../../src/ui/operations/rebalance/OpenOrdersPanel'

vi.mock('../../../../src/app/trading/open-orders-client', () => ({ fetchOpenOrders: vi.fn(), cancelOpenOrder: vi.fn() }))

const order = { orderId: 'O-1', orgNo: '0000001', code: '005930', name: '삼성전자', side: 'buy' as const, orderQty: 10, filledQty: 3, remainingQty: 7, price: 70000, orderedAt: '2026-10-27T01:00:00Z' }

beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchOpenOrders).mockResolvedValue([order]) })
afterEach(cleanup)

describe('미체결 패널 아이콘 표시', () => {
  it('취소 버튼은 아이콘과 짧은 툴팁으로 표시된다', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={qc}><OpenOrdersPanel target={{ accountId: 'a1', productCode: '01' }} onCancelled={vi.fn()} /></QueryClientProvider>)
    const button = await screen.findByRole('button', { name: '삼성전자 취소' })
    expect(button.querySelector('svg')).not.toBeNull()
    expect(button).not.toHaveTextContent('취소')
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
    fireEvent.click(button)
    expect(await screen.findByRole('dialog', { name: '주문 취소 확인' })).toBeInTheDocument()
  })
})
