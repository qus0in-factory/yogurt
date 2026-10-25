import { describe, expect, it } from 'vitest'
import { withWeights } from '../../../src/app/kis/holding-weights'

describe('withWeights', () => {
  it('한 종목뿐이면 비중 100이다', () => {
    expect(withWeights([{ code: 'A', evaluationAmount: 12000 }]))
      .toEqual([{ code: 'A', evaluationAmount: 12000, weight: 100 }])
  })

  it('비중은 소수점 2자리로 반올림한다', () => {
    const weights = withWeights([{ evaluationAmount: 2 }, { evaluationAmount: 1 }]).map((holding) => holding.weight)
    expect(weights).toEqual([66.67, 33.33])
  })

  it('평가총액이 0이면 모든 비중은 0이다', () => {
    const weights = withWeights([{ evaluationAmount: 0 }, { evaluationAmount: 0 }]).map((holding) => holding.weight)
    expect(weights).toEqual([0, 0])
  })

  it('빈 배열이면 결과도 빈 배열이다', () => {
    expect(withWeights([])).toEqual([])
  })

  it('반올림한 비중의 합은 100에 가깝다', () => {
    const holdings = withWeights([{ evaluationAmount: 1 }, { evaluationAmount: 1 }, { evaluationAmount: 1 }])
    const sum = holdings.reduce((total, holding) => total + holding.weight, 0)
    expect(sum).toBeCloseTo(100, 1)
    expect(holdings.map((holding) => holding.weight)).toEqual([33.33, 33.33, 33.33])
  })

  it('원래 종목 필드는 그대로 유지한다', () => {
    const [weighted] = withWeights([{ code: 'A', name: '삼성전자', evaluationAmount: 30 }])
    expect(weighted.code).toBe('A')
    expect(weighted.evaluationAmount).toBe(30)
    expect(weighted.weight).toBe(100)
  })
})
