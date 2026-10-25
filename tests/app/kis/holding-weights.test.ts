import { describe, expect, it } from 'vitest'
import { withWeights } from '../../../src/app/kis/holding-weights'

describe('withWeights', () => {
  it('현금이 없으면 한 종목 비중은 100이다', () => {
    expect(withWeights([{ code: 'A', evaluationAmount: 12000 }], 0))
      .toEqual({ holdings: [{ code: 'A', evaluationAmount: 12000, weight: 100 }], cashWeight: 0 })
  })

  it('종목 비중은 소수점 2자리로 반올림한다', () => {
    const { holdings, cashWeight } = withWeights([{ evaluationAmount: 2 }, { evaluationAmount: 1 }], 0)
    expect(holdings.map((holding) => holding.weight)).toEqual([66.67, 33.33])
    expect(cashWeight).toBe(0)
  })

  it('종목과 현금의 합이 0이면 모든 비중은 0이다', () => {
    const result = withWeights([{ evaluationAmount: 0 }, { evaluationAmount: 0 }], 0)
    expect(result.holdings.map((holding) => holding.weight)).toEqual([0, 0])
    expect(result.cashWeight).toBe(0)
  })

  it('종목이 없어도 현금 비중은 100이다', () => {
    expect(withWeights([], 5000)).toEqual({ holdings: [], cashWeight: 100 })
  })

  it('종목과 현금 비중의 합은 100에 가깝다', () => {
    const { holdings, cashWeight } = withWeights(
      [{ evaluationAmount: 12000 }, { evaluationAmount: 4000 }],
      1000,
    )
    expect(holdings.map((holding) => holding.weight)).toEqual([70.59, 23.53])
    expect(cashWeight).toBe(5.88)
    const sum = holdings.reduce((total, holding) => total + holding.weight, cashWeight)
    expect(sum).toBeCloseTo(100, 2)
  })

  it('원래 종목 필드는 그대로 유지한다', () => {
    const [weighted] = withWeights([{ code: 'A', name: '삼성전자', evaluationAmount: 30 }], 10).holdings
    expect(weighted.code).toBe('A')
    expect(weighted.evaluationAmount).toBe(30)
    expect(weighted.weight).toBe(75)
  })
})
