import { describe, expect, it } from 'vitest'
import { RISK_LIMIT_PERCENT, riskRatio } from '../../../src/app/kis/risk-ratio'

describe('riskRatio', () => {
  it('위험자산 비중이 70.00%이면 초과하지 않는다', () => {
    const result = riskRatio([{ code: 'R', evaluationAmount: 7000 }], 3000, {})
    expect(result).toEqual({ riskAmount: 7000, total: 10000, ratio: 70, exceeds: false })
  })

  it('위험자산 비중이 70.01%이면 초과한다', () => {
    const result = riskRatio([{ code: 'R', evaluationAmount: 7001 }], 2999, {})
    expect(result.ratio).toBe(70.01)
    expect(result.exceeds).toBe(true)
    expect(RISK_LIMIT_PERCENT).toBe(70)
  })

  it('표시값이 70.00%로 반올림되어도 원래 비중이 70%를 넘으면 초과한다', () => {
    const result = riskRatio([{ code: 'R', evaluationAmount: 70004 }], 29996, {})
    expect(result.ratio).toBe(70)
    expect(result.exceeds).toBe(true)
  })

  it('safe 종목은 위험금액에서 제외한다', () => {
    const result = riskRatio(
      [{ code: 'R', evaluationAmount: 7000 }, { code: 'S', evaluationAmount: 3000 }],
      0,
      { S: 'safe' },
    )
    expect(result.riskAmount).toBe(7000)
    expect(result.ratio).toBe(70)
  })

  it('지정하지 않은 종목은 위험으로 취급한다', () => {
    const result = riskRatio([{ code: 'U', evaluationAmount: 1000 }], 0, {})
    expect(result.riskAmount).toBe(1000)
    expect(result.ratio).toBe(100)
  })

  it('총액이 0이면 비중 0이고 초과하지 않는다', () => {
    expect(riskRatio([], 0, {})).toEqual({ riskAmount: 0, total: 0, ratio: 0, exceeds: false })
  })

  it('비중은 소수 두 자리로 반올림한다', () => {
    expect(riskRatio([{ code: 'R', evaluationAmount: 1 }], 2, {}).ratio).toBe(33.33)
  })
})
