// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as fillStream from '../../../../src/app/trading/fill-stream'
import { useRebalanceFillStream } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'

vi.mock('../../../../src/app/trading/fill-stream')
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))

const target = { accountId: 'a', productCode: '01' }
const orders = {
  'a:01:005930:buy': { requestId: 'r1', state: 'done' as const, orderId: 'ORD-B', updatedAt: '' },
}

describe('useRebalanceFillStream buy result', () => {
  let onUpdate: (u: fillStream.FillUpdate) => void
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, update) => {
      onUpdate = update
      return vi.fn()
    })
  })

  it('매수 filled 결과를 주문 기록 삭제 후에도 보존한다', () => {
    const onClear = vi.fn()
    const { result } = renderHook(() => useRebalanceFillStream(target, orders, onClear))
    act(() => onUpdate({ orderId: 'ORD-B', status: 'filled', filledQty: 10, remainingQty: 0, checkedAt: '' }))
    expect(onClear).toHaveBeenCalledWith('a:01:005930:buy')
    expect(result.current.fillEventsByKey['005930:buy']).toBe('filled')
  })
})
