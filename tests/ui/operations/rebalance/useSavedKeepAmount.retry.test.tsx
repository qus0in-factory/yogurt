// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useSavedKeepAmount } from '../../../../src/ui/operations/rebalance/useSavedKeepAmount'

const save = vi.hoisted(() => ({ isPending: false, isError: false, mutate: vi.fn() }))
vi.mock('../../../../src/app/rebalance/queries', () => ({
  useKeepAmount: () => ({ data: { keepAmount: 0 }, isLoading: false, isError: false, dataUpdatedAt: 1, isFetching: false, refetch: vi.fn() }),
  useSaveKeepAmount: () => save,
}))

it('저장 실패는 재시도 중에도 유지하고 성공할 때만 해제한다', () => {
  let options: { onError?: () => void; onSuccess?: (data: { keepAmount: number }) => void } = {}
  save.mutate.mockImplementation((_value, next) => { options = next })
  const { result, rerender } = renderHook(() => useSavedKeepAmount('a', '01'))

  act(() => result.current.saveKeepAmount(1000))
  act(() => options.onError?.())
  expect(result.current.isError).toBe(true)

  save.isPending = true; save.isError = false
  rerender()
  expect(result.current.isSaving).toBe(true)
  expect(result.current.isError).toBe(true)

  act(() => options.onSuccess?.({ keepAmount: 1000 }))
  expect(result.current.isError).toBe(false)
})
