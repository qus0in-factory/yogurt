// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as fillStream from '../../../../src/app/trading/fill-stream'
import { useRebalanceFillStream } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'

vi.mock('../../../../src/app/trading/fill-stream')
const invalidateMock = vi.fn()
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: invalidateMock }) }))

describe('useRebalanceFillStream', () => {
  const unsubMock = vi.fn()
  let capturedHandler: (u: fillStream.FillUpdate) => void, capturedDone: (finished: string[]) => void, capturedError: () => void

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, onUpdate, onDone, ...rest) => {
      capturedHandler = onUpdate; capturedDone = onDone ?? (() => {}); capturedError = (rest[0] as unknown as () => void) ?? (() => {}); return unsubMock
    })
  })

  const target = { accountId: 'acc-1', productCode: '01' }
  const orders = {
    'acc-1:01:005930:buy': { requestId: 'r1', state: 'done' as const, orderId: 'ORD-1', updatedAt: '' },
    'acc-1:01:000660:sell': { requestId: 'r2', state: 'done' as const, orderId: 'ORD-2', updatedAt: '' },
    'acc-1:01:035420:buy': { requestId: 'r3', state: 'done' as const, updatedAt: '' }, // no orderId
  }

  it('주문 번호가 있는 것만 구독하고 없는 것은 noOrderIdKeys에 넣는다', () => {
    const onClear = vi.fn()
    const { result, unmount } = renderHook(() => useRebalanceFillStream(target, orders, onClear))
    expect(fillStream.subscribeFills).toHaveBeenCalledWith(
      expect.objectContaining({ orderIds: ['ORD-1', 'ORD-2'] }), expect.any(Function), expect.any(Function), expect.any(Function),
    )
    expect(result.current.noOrderIdKeys.has('035420:buy')).toBe(true)
    unmount()
    expect(unsubMock).toHaveBeenCalled()
  })

  it('filled는 done 해제와 무효화, partial·open은 유지한다', () => {
    const onClear = vi.fn()
    renderHook(() => useRebalanceFillStream(target, orders, onClear))
    act(() => capturedHandler({ orderId: 'ORD-1', status: 'filled', filledQty: 10, remainingQty: 0, checkedAt: '' }))
    expect(onClear).toHaveBeenCalledWith('acc-1:01:005930:buy')
    expect(invalidateMock).toHaveBeenCalled()
    act(() => capturedHandler({ orderId: 'ORD-2', status: 'partial', filledQty: 4, remainingQty: 6, checkedAt: '' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('onError 시 isStreamError가 되고 reconnect로 리셋한다', () => {
    const onClear = vi.fn()
    const { result } = renderHook(() => useRebalanceFillStream(target, orders, onClear))
    expect(result.current.isStreamError).toBe(false)
    act(() => capturedError())
    expect(result.current.isStreamError).toBe(true)
    act(() => result.current.reconnect())
    expect(result.current.isStreamError).toBe(false)
  })
})
