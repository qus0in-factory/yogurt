import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as stockApi from '../../../../src/app/stocks/stock-lookup'
import { PortfolioEditorDialog } from '../../../../src/ui/operations/portfolio/PortfolioEditorDialog'

afterEach(cleanup)

describe('PortfolioEditorDialog', () => {
  it('기본 요소를 렌더링하고 합계 100%가 아닐 때 저장을 비활성화한다', () => {
    render(<PortfolioEditorDialog open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '새 포트폴리오' })).toBeInTheDocument()
    expect(screen.getByLabelText('포트폴리오 이름')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '종목 추가' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현금 추가' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('항목을 추가하고 조회를 통해 종목명이 채워진 뒤 100%를 맞추면 저장이 활성화된다', async () => {
    vi.spyOn(stockApi, 'lookupStockName').mockResolvedValue({ status: 'success', code: '005930', name: '삼성전자' })
    const onSubmit = vi.fn()
    render(<PortfolioEditorDialog open onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('포트폴리오 이름'), { target: { value: '성장형' } })
    fireEvent.click(screen.getByRole('button', { name: '종목 추가' }))
    fireEvent.click(screen.getByRole('button', { name: '현금 추가' }))

    fireEvent.change(screen.getByLabelText('종목코드'), { target: { value: '005930' } })
    await act(async () => {
      fireEvent.blur(screen.getByLabelText('종목코드'))
    })
    const weightInputs = screen.getAllByLabelText('목표 비중 (%)')
    fireEvent.change(weightInputs[0], { target: { value: '70.00' } })
    fireEvent.change(weightInputs[1], { target: { value: '30.00' } })

    const saveBtn = screen.getByRole('button', { name: '저장' })
    expect(saveBtn).not.toBeDisabled()
    fireEvent.click(saveBtn)

    expect(onSubmit).toHaveBeenCalledWith({
      name: '성장형',
      items: [
        { kind: 'security', stockCode: '005930', stockName: '삼성전자', targetWeightBps: 7000 },
        { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 3000 },
      ],
    })
  })

  it('assignedCount > 0 일 때 영향 대상 경고 안내를 표시한다', () => {
    render(<PortfolioEditorDialog open assignedCount={3} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('연결된 3개 대상의 목표가 함께 변경됩니다')).toBeInTheDocument()
  })

  it('serverError prop이 주어지면 오류를 표시한다', () => {
    render(<PortfolioEditorDialog open serverError="서버 저장 오류" onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('서버 저장 오류')).toBeInTheDocument()
  })
})
