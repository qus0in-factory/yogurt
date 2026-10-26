import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePortfolioEditor } from '../../../../src/ui/operations/portfolio/usePortfolioEditor'

const setupEditor = () => {
  const hook = renderHook(() => usePortfolioEditor())
  act(() => { hook.result.current.setName('테스트'); hook.result.current.addSecurityRow() })
  return hook
}

describe('usePortfolioEditor stock name requirement', () => {
  it('종목명이 비어 있는 종목 행은 canSave가 false이고 검증 시 안내 오류를 반환한다', () => {
    const { result } = setupEditor()
    const sec = result.current.items[0]
    act(() => {
      result.current.updateRow(sec.id, 'stockCode', '005930')
      result.current.updateRow(sec.id, 'weightPercent', '100.00')
    })
    expect(result.current.canSave).toBe(false)
    act(() => { expect(result.current.validate()).toBeNull() })
    expect(result.current.rowErrors[sec.id]?.stockName).toBe('종목명을 확인할 수 없습니다. 종목코드를 확인하세요')
  })

  it('코드 변경 시 이전 이름을 즉시 비우고 새 이름이 채워질 때까지 저장을 막는다', () => {
    const { result } = setupEditor()
    const sec = result.current.items[0]
    act(() => {
      result.current.updateRow(sec.id, 'stockCode', '005930')
      result.current.updateRow(sec.id, 'stockName', '삼성전자')
      result.current.updateRow(sec.id, 'weightPercent', '100.00')
    })
    expect(result.current.canSave).toBe(true)

    act(() => { result.current.updateRow(sec.id, 'stockCode', '000660') })
    expect(result.current.items[0].stockName).toBe('')
    expect(result.current.canSave).toBe(false)

    act(() => { result.current.updateRow(sec.id, 'stockName', 'SK하이닉스') })
    expect(result.current.canSave).toBe(true)
  })

  it('조회 중(로딩)일 때는 canSave가 false이다', () => {
    const { result } = setupEditor()
    const sec = result.current.items[0]
    act(() => {
      result.current.updateRow(sec.id, 'stockCode', '005930')
      result.current.updateRow(sec.id, 'stockName', '삼성전자')
      result.current.updateRow(sec.id, 'weightPercent', '100.00')
    })
    expect(result.current.canSave).toBe(true)

    act(() => { result.current.setRowLoading(sec.id, true) })
    expect(result.current.canSave).toBe(false)

    act(() => { result.current.setRowLoading(sec.id, false) })
    expect(result.current.canSave).toBe(true)
  })

  it('현금 행은 고정 이름을 가지며 영향 없이 저장 가능하다', () => {
    const { result } = renderHook(() => usePortfolioEditor())
    act(() => { result.current.setName('현금포트'); result.current.addCashRow() })
    act(() => { result.current.updateRow(result.current.items[0].id, 'weightPercent', '100.00') })
    expect(result.current.canSave).toBe(true)
  })
})
