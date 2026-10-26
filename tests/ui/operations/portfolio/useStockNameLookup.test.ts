import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as stockApi from '../../../../src/app/stocks/stock-lookup'
import { useStockNameLookup } from '../../../../src/ui/operations/portfolio/useStockNameLookup'

describe('useStockNameLookup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('500ms 디바운스 후 1회만 조회를 호출한다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({
      status: 'success', code: '005930', name: '삼성전자',
    })
    const { result, rerender } = renderHook(({ code }) => useStockNameLookup(code), {
      initialProps: { code: '005' },
    })
    rerender({ code: '0059' })
    rerender({ code: '005930' })

    expect(spy).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('005930')
    expect(result.current.result).toBe('삼성전자')
  })

  it('enabled가 false(현금 행 등)이면 조회를 호출하지 않는다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName')
    renderHook(() => useStockNameLookup('005930', false))
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('trigger(blur) 호출 시 즉시 조회를 수행한다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({
      status: 'success', code: '005930', name: '삼성전자',
    })
    const { result } = renderHook(() => useStockNameLookup('005930'))
    await act(async () => {
      result.current.trigger('005930')
    })
    expect(spy).toHaveBeenCalledWith('005930')
  })

  it('소문자 코드는 대문자로 정규화하여 요청한다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({
      status: 'success', code: '005930A', name: '삼성전자우',
    })
    renderHook(() => useStockNameLookup('005930a'))
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(spy).toHaveBeenCalledWith('005930A')
  })

  it('패턴 위반(한글, 20자 초과)은 요청하지 않는다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName')
    const { result, rerender } = renderHook(({ code }) => useStockNameLookup(code), {
      initialProps: { code: '한글코드' },
    })
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(spy).not.toHaveBeenCalled()
    expect(result.current.error).toBe('invalid_format')

    rerender({ code: 'A'.repeat(21) })
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(spy).not.toHaveBeenCalled()
    expect(result.current.error).toBe('invalid_format')
  })
})
