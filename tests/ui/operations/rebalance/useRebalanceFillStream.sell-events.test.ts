// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as fillStream from '../../../../src/app/trading/fill-stream'
import { useRebalanceFillStream } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'

vi.mock('../../../../src/app/trading/fill-stream')
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))

const target = { accountId: 'acc-1', productCode: '01' }
const orders = {
  'acc-1:01:000660:sell': { requestId: 'r1', state: 'done' as const, orderId: 'ORD-S', updatedAt: '' },
}

describe('useRebalanceFillStream sellEvents', () => {
  let onUpdate: (u: fillStream.FillUpdate) => void
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fillStream.subscribeFills).mockImplementation((_q, update) => {
      onUpdate = update
      return vi.fn()
    })
  })

  it('filled 이벤트를 onClearKey 전에 보존하고 target 변경 시 비운다', () => {
    const onClear = vi.fn()
    const { result, rerender } = renderHook(({ current }) => useRebalanceFillStream(current, orders, onClear), {
      initialProps: { current: target },
    })
    act(() => onUpdate({ orderId: 'ORD-S', status: 'filled', filledQty: 10, remainingQty: 0, checkedAt: '' }))
    expect(result.current.sellEvents).toMatchObject([{ pair: '000660:sell', status: 'filled' }])
    expect(onClear).toHaveBeenCalledWith('acc-1:01:000660:sell')

    rerender({ current: { accountId: 'acc-2', productCode: '01' } })
    expect(result.current.sellEvents).toEqual([])
  })
})
