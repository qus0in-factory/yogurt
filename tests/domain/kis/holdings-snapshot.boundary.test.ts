import { expect, it } from 'vitest'
import { isHoldingsFresh, parseStoredHoldings } from '../../../src/domain/kis/holdings-snapshot'

const holding = {
  code: 'A', name: '종목', quantity: 1, averagePrice: 10, purchaseAmount: 10,
  currentPrice: 9, evaluationAmount: 9, profitLoss: -1, profitLossRate: -10,
}
const stored = { holdings: [holding], stockEvaluationWon: 9, asOf: '2026-10-18 10:00' }

it.each([
  ['2026-10-25T00:59:59.999Z', true],
  ['2026-10-25T01:00:00.000Z', true],
  ['2026-10-25T01:00:00.001Z', false],
  ['2026-10-18T00:59:59.999Z', false],
  ['2026-10-18T01:00:00.000Z', true],
])('보유 캐시 신선도 경계 %s → %s', (now, fresh) => {
  expect(isHoldingsFresh(stored.asOf, new Date(now))).toBe(fresh)
})

it('해석할 수 없는 캐시 시각은 신선하지 않다', () => {
  expect(isHoldingsFresh('invalid', new Date('2026-10-25T01:00:00Z'))).toBe(false)
})

it.each(['null', '[]', '{}', '', '123'])('잘못된 최상위 저장값 %s', (raw) => {
  expect(parseStoredHoldings(raw)).toBeNull()
})

it.each([
  { ...stored, holdings: [] },
  { ...stored, holdings: [{ ...holding, quantity: null }] },
  { ...stored, holdings: [{ ...holding, evaluationAmount: '9' }] },
  { ...stored, holdings: [{ ...holding, code: undefined }] },
  { ...stored, holdings: [holding, { ...holding, currentPrice: null }] },
])('空 배열·필드 누락·혼합 불량 행은 전체 저장값을 거부한다: %j', (value) => {
  expect(parseStoredHoldings(JSON.stringify(value))).toBeNull()
})

it('유효한 손실 종목과 요약 평가액 0은 허용한다', () => {
  const value = { ...stored, stockEvaluationWon: 0 }
  expect(parseStoredHoldings(JSON.stringify(value))).toEqual(value)
})
