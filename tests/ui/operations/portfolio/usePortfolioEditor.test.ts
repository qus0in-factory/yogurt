import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePortfolioEditor } from '../../../../src/ui/operations/portfolio/usePortfolioEditor'

describe('usePortfolioEditor', () => {
  it('기본 상태에서 빈 항목 목록과 합계 0을 반환한다', () => {
    const { result } = renderHook(() => usePortfolioEditor())
    expect(result.current.name).toBe('')
    expect(result.current.items).toEqual([])
    expect(result.current.totalBps).toBe(0)
    expect(result.current.hasCash).toBe(false)
  })

  it('종목과 현금을 추가하고 비중 합계를 계산한다', () => {
    const { result } = renderHook(() => usePortfolioEditor())
    act(() => {
      result.current.setName('테스트 포트폴리오')
      result.current.addSecurityRow()
      result.current.addCashRow()
    })
    expect(result.current.items.length).toBe(2)
    expect(result.current.hasCash).toBe(true)

    const [sec, cash] = result.current.items
    act(() => {
      result.current.updateRow(sec.id, 'stockCode', '005930')
      result.current.updateRow(sec.id, 'stockName', '삼성전자')
      result.current.updateRow(sec.id, 'weightPercent', '60.00')
      result.current.updateRow(cash.id, 'weightPercent', '40.00')
    })
    expect(result.current.totalBps).toBe(10000)
    expect(result.current.canSave).toBe(true)
  })

  it('합계가 100%가 아니면 canSave가 false이다', () => {
    const { result } = renderHook(() => usePortfolioEditor())
    act(() => {
      result.current.setName('포트폴리오')
      result.current.addSecurityRow()
    })
    const sec = result.current.items[0]
    act(() => {
      result.current.updateRow(sec.id, 'stockCode', '005930')
      result.current.updateRow(sec.id, 'stockName', '삼성전자')
      result.current.updateRow(sec.id, 'weightPercent', '90.00')
    })
    expect(result.current.totalBps).toBe(9000)
    expect(result.current.canSave).toBe(false)
  })

  it('중복 종목코드가 있으면 검증 시 오류를 설정한다', () => {
    const { result } = renderHook(() => usePortfolioEditor())
    act(() => {
      result.current.setName('포트폴리오')
      result.current.addSecurityRow()
      result.current.addSecurityRow()
    })
    const [row1, row2] = result.current.items
    act(() => {
      result.current.updateRow(row1.id, 'stockCode', '005930')
      result.current.updateRow(row1.id, 'stockName', '삼성전자')
      result.current.updateRow(row1.id, 'weightPercent', '50.00')
      result.current.updateRow(row2.id, 'stockCode', '005930')
      result.current.updateRow(row2.id, 'stockName', '삼성전자우')
      result.current.updateRow(row2.id, 'weightPercent', '50.00')
    })
    act(() => {
      result.current.validate()
    })
    expect(result.current.rowErrors[row2.id]?.stockCode).toBeDefined()
    expect(result.current.canSave).toBe(false)
  })
})
