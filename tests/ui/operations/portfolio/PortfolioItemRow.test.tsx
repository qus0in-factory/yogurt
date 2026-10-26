import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PortfolioItemRow } from '../../../../src/ui/operations/portfolio/PortfolioItemRow'

afterEach(cleanup)

describe('PortfolioItemRow', () => {
  it('현금 행은 고정 라벨과 비중 입력만 표시하고 종목코드 입력을 숨긴다', () => {
    const item = { id: 'c1', kind: 'cash' as const, stockCode: '', stockName: '현금/예수금', weightPercent: '20.00' }
    render(<PortfolioItemRow item={item} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('현금/예수금')).toBeInTheDocument()
    expect(screen.queryByLabelText('종목코드')).not.toBeInTheDocument()
    expect(screen.getByLabelText('목표 비중 (%)')).toHaveValue('20.00')
  })

  it('삭제 버튼은 최소 44px 히트 영역을 가진다', () => {
    const item = { id: 's1', kind: 'security' as const, stockCode: '005930', stockName: '삼성전자', weightPercent: '50.00' }
    render(<PortfolioItemRow item={item} onChange={vi.fn()} onRemove={vi.fn()} />)
    const removeBtn = screen.getByRole('button', { name: '항목 삭제' })
    expect(removeBtn).toHaveClass('min-h-[44px]', 'min-w-[44px]')
  })

  it('입력 변경 시 onChange 콜백이 올바른 필드와 함께 호출된다', () => {
    const onChange = vi.fn()
    const item = { id: 's1', kind: 'security' as const, stockCode: '', stockName: '', weightPercent: '' }
    render(<PortfolioItemRow item={item} onChange={onChange} onRemove={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('종목코드'), { target: { value: '005930' } })
    expect(onChange).toHaveBeenCalledWith('stockCode', '005930')
  })

  it('종목명 칸은 읽기 전용으로 표시되어 직접 입력할 수 없다', () => {
    const item = { id: 's1', kind: 'security' as const, stockCode: '005930', stockName: '삼성전자', weightPercent: '50.00' }
    render(<PortfolioItemRow item={item} onChange={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByLabelText('종목명')).toHaveAttribute('readonly')
  })
})
