// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as fillStream from '../../../../src/app/trading/fill-stream'
import { useRebalanceFillStream } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'

vi.mock('../../../../src/app/trading/fill-stream')
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))

describe('useRebalanceFillStream 7건 초과 분할 구독', () => {
  let doneCallbacks: Array<(finished: string[]) => void> = []

  beforeEach(() => {
    vi.clearAllMocks()
    doneCallbacks = []
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, _onUpdate, onDone) => {
      if (onDone) doneCallbacks.push(onDone)
      return vi.fn()
    })
  })

  const target = { accountId: 'acc-1', productCode: '01' }
  const orders: Record<string, any> = {}
  for (let i = 1; i <= 9; i++) {
    orders[`acc-1:01:code${i}:buy`] = { requestId: `r${i}`, state: 'done', orderId: `ORD-${i}`, updatedAt: '' }
  }

  it('9건이면 7개와 2개로 나눠 순서대로 구독하고 남은 건수를 계산한다', () => {
    const onClear = vi.fn()
    const { result } = renderHook(() => useRebalanceFillStream(target, orders, onClear))

    expect(fillStream.subscribeFills).toHaveBeenCalledTimes(1)
    expect(fillStream.subscribeFills).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderIds: ['ORD-1', 'ORD-2', 'ORD-3', 'ORD-4', 'ORD-5', 'ORD-6', 'ORD-7'] }),
      expect.any(Function), expect.any(Function), expect.any(Function),
    )
    expect(result.current.remainingCount).toBe(2)

    act(() => doneCallbacks[0]([]))

    expect(fillStream.subscribeFills).toHaveBeenCalledTimes(2)
    expect(fillStream.subscribeFills).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderIds: ['ORD-8', 'ORD-9'] }),
      expect.any(Function), expect.any(Function), expect.any(Function),
    )
    expect(result.current.remainingCount).toBe(0)
  })
})
