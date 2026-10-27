// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { invalidateRebalanceInputs, useRebalanceAutoRefresh } from '../../../../src/ui/operations/rebalance/useRebalanceAutoRefresh'

const invalidateMock = vi.fn()
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: invalidateMock }) }))

const target = { accountId: 'a1', productCode: '01' }

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useRebalanceAutoRefresh', () => {
  it('refresh는 입력·잔고 쿼리를 무효화한다', () => {
    const { result } = renderHook(() => useRebalanceAutoRefresh(target))
    act(() => { result.current.refresh() })
    expect(invalidateMock).toHaveBeenCalledWith({ queryKey: ['rebalance-inputs', 'a1', '01'] })
    expect(invalidateMock).toHaveBeenCalledWith({ queryKey: ['product-balance', 'a1', '01'] })
    expect(invalidateMock).toHaveBeenCalledWith({ queryKey: ['account-assets', 'a1', '01'] })
  })
  it('30초 주기 폴링과 포커스 자동 조회를 만들지 않는다', () => {
    renderHook(() => useRebalanceAutoRefresh(target))
    act(() => { vi.advanceTimersByTime(120_000) })
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(invalidateMock).not.toHaveBeenCalled()
  })
  it('target이 없으면 refresh는 아무것도 하지 않는다', () => {
    const { result } = renderHook(() => useRebalanceAutoRefresh(null))
    act(() => { result.current.refresh() })
    expect(invalidateMock).not.toHaveBeenCalled()
  })
  it('invalidateRebalanceInputs는 세 키에 계좌 튜플을 붙인다', () => {
    invalidateRebalanceInputs({ invalidateQueries: invalidateMock } as never, 'a1', '01')
    expect(invalidateMock).toHaveBeenCalledTimes(3)
  })
})
