import { expect, it } from 'vitest'
import { riskRatio } from '../../../src/domain/kis/risk-ratio'

it('보유 없이 현금만 있으면 총액은 유지하고 위험 비율은 0이다', () => {
  expect(riskRatio([], 123, {})).toEqual({
    riskAmount: 0, total: 123, ratio: 0, exceeds: false,
  })
})

it('전부 안전 분류이면 현금이 없어도 위험 비율은 0이다', () => {
  expect(riskRatio([{ code: 'A', evaluationAmount: 100 }], 0, { A: 'safe' })).toEqual({
    riskAmount: 0, total: 100, ratio: 0, exceeds: false,
  })
})

it('표시가 70으로 반올림되어도 원래 비중이 낮으면 초과하지 않는다', () => {
  expect(riskRatio([{ code: 'A', evaluationAmount: 69999 }], 30001, {})).toEqual({
    riskAmount: 69999, total: 100000, ratio: 70, exceeds: false,
  })
})

it('같은 코드의 여러 행도 합산하고 호출자 데이터를 바꾸지 않는다', () => {
  const holdings = [{ code: 'A', evaluationAmount: 20 }, { code: 'A', evaluationAmount: 30 }]
  const before = structuredClone(holdings)
  const classes = { A: 'safe' as const }
  expect(riskRatio(holdings, 50, classes)).toEqual({
    riskAmount: 0, total: 100, ratio: 0, exceeds: false,
  })
  expect(holdings).toEqual(before)
  expect(classes).toEqual({ A: 'safe' })
})
