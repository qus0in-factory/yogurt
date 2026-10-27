// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import * as fillStream from '../../../../src/app/trading/fill-stream'
import { useRebalanceFillStream } from '../../../../src/ui/operations/rebalance/useRebalanceFillStream'

vi.mock('../../../../src/app/trading/fill-stream')
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))

const target = { accountId: 'a', productCode: '01' }
const orders = { 'a:01:005930:buy': { requestId: 'r', state: 'done' as const, orderId: 'O-1', updatedAt: '' } }

it('closed_partial도 주문 기록을 정리하고 결과 상태를 보존한다', () => {
  let onUpdate: (u: fillStream.FillUpdate) => void
  vi.mocked(fillStream.subscribeFills).mockImplementation((_q, update) => { onUpdate = update; return vi.fn() })
  const onClear = vi.fn()
  const { result } = renderHook(() => useRebalanceFillStream(target, orders, onClear))
  act(() => onUpdate({ orderId: 'O-1', status: 'closed_partial', filledQty: 4, remainingQty: 0, checkedAt: '' }))
  expect(onClear).toHaveBeenCalledWith('a:01:005930:buy')
  expect(result.current.fillEventsByKey['005930:buy']).toBe('closed_partial')
  expect(result.current.fillEventList).toMatchObject([{ orderId: 'O-1', pair: '005930:buy', status: 'closed_partial' }])
  expect(result.current.fillEventList[0].at).toBeTypeOf('number')
})
