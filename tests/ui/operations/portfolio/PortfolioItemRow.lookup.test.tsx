import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as stockApi from '../../../../src/app/stocks/stock-lookup'
import { PortfolioItemRow } from '../../../../src/ui/operations/portfolio/PortfolioItemRow'

afterEach(cleanup)

describe('PortfolioItemRow stock name lookup', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  const makeItem = (stockName = '', kind: 'security' | 'cash' = 'security') => ({
    id: 's1', kind, stockCode: kind === 'cash' ? '' : '005930', stockName, weightPercent: '50.00',
  })

  it('조회 중일 때는 종목명 확인 중 안내를 표시한다', () => {
    vi.spyOn(stockApi, 'lookupStockName').mockReturnValue(new Promise(() => {}))
    render(<PortfolioItemRow item={makeItem('')} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('종목명 확인 중')).toBeInTheDocument()
  })

  it('조회 성공 시 조회 결과 이름으로 stockName을 채운다', async () => {
    vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({ status: 'success', code: '005930', name: '삼성전자' })
    const onChange = vi.fn()
    render(<PortfolioItemRow item={makeItem('')} onChange={onChange} onRemove={vi.fn()} />)
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(onChange).toHaveBeenCalledWith('stockName', '삼성전자')
  })

  it('404 및 503 오류 시 안내 메시지를 표시한다', async () => {
    vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({ status: 'not_found' })
    const { rerender } = render(<PortfolioItemRow item={makeItem('')} onChange={vi.fn()} onRemove={vi.fn()} />)
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(screen.getByText('없는 종목코드입니다')).toBeInTheDocument()

    vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({ status: 'unavailable' })
    rerender(<PortfolioItemRow item={{ ...makeItem(''), stockCode: '000660' }} onChange={vi.fn()} onRemove={vi.fn()} />)
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(screen.getByText('잠시 후 다시 시도해주세요')).toBeInTheDocument()
  })

  it('패턴 위반 시 안내 메시지를 표시하고 요청하지 않는다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName')
    render(<PortfolioItemRow item={{ ...makeItem(''), stockCode: '한글' }} onChange={vi.fn()} onRemove={vi.fn()} />)
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(spy).not.toHaveBeenCalled()
    expect(screen.getByText('형식이 맞지 않는 코드입니다')).toBeInTheDocument()
  })

  it('blur 이벤트 시 즉시 조회하고 현금 행은 조회하지 않는다', async () => {
    const spy = vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({ status: 'success', code: '005930', name: '삼성전자' })
    const onChange = vi.fn()
    const { unmount } = render(<PortfolioItemRow item={makeItem('')} onChange={onChange} onRemove={vi.fn()} />)
    await act(async () => { fireEvent.blur(screen.getByLabelText('종목코드')) })
    expect(onChange).toHaveBeenCalledWith('stockName', '삼성전자')
    unmount()

    render(<PortfolioItemRow item={makeItem('현금', 'cash')} onChange={vi.fn()} onRemove={vi.fn()} />)
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
