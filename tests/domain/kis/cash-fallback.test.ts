import { describe, expect, it } from 'vitest'
import { riskRatio } from '../../../src/app/kis/risk-ratio'
import { parseCachedCash, resolveCash } from '../../../src/domain/kis/cash-fallback'

// resolveCash returns response-facing summary fields; parseCachedCash returns null for invalid KV values.
const asOf = '2026-10-25 10:00'
const cached = { cashWon: 3000, asOf: '2026-10-24 15:40', source: 'kis' as const }
const unavailable = { cash: 0, cashSource: null, cashAsOf: null, cashFallback: false, cashUnavailable: true }

describe('resolveCash', () => {
  it('KIS 현금이 양수면 그대로 쓰고 저장값을 대체로 쓰지 않는다', () => {
    expect(resolveCash(1900000, cached, asOf)).toEqual({
      cash: 1900000, cashSource: 'kis', cashAsOf: asOf, cashFallback: false, cashUnavailable: false,
    })
  })
  it('KIS 현금이 0이면 저장된 kis 현금을 대체값으로 쓴다', () => {
    expect(resolveCash(0, cached, asOf)).toEqual({
      cash: 3000, cashSource: 'kis', cashAsOf: '2026-10-24 15:40', cashFallback: true, cashUnavailable: false,
    })
  })
  it('KIS 현금이 0이면 저장된 user 현금도 대체값으로 쓴다', () => {
    expect(resolveCash(0, { ...cached, source: 'user' }, asOf)).toEqual({
      cash: 3000, cashSource: 'user', cashAsOf: '2026-10-24 15:40', cashFallback: true, cashUnavailable: false,
    })
  })
  it('KIS 현금이 0이고 저장값이 없거나 깨졌으면 사용할 수 없다', () => {
    expect(resolveCash(0, null, asOf)).toEqual(unavailable)
    expect(resolveCash(0, parseCachedCash('{bad'), asOf)).toEqual(unavailable)
  })
  it('대체 현금을 위험자산 비중 계산에 사용한다', () => {
    const cash = resolveCash(0, cached, asOf).cash
    expect(cash).toBe(3000)
    expect(riskRatio([{ code: 'R', evaluationAmount: 7000 }], cash, {})).toEqual({
      riskAmount: 7000, total: 10000, ratio: 70, exceeds: false,
    })
  })
})

describe('parseCachedCash', () => {
  it('유효한 저장값만 인정한다', () => {
    expect(parseCachedCash(JSON.stringify(cached))).toEqual(cached)
    expect(parseCachedCash(JSON.stringify({ ...cached, source: 'user' }))).toEqual({ ...cached, source: 'user' })
  })
  it.each([
    ['깨진 JSON', '{bad'],
    ['음수', JSON.stringify({ ...cached, cashWon: -1 })],
    ['0', JSON.stringify({ ...cached, cashWon: 0 })],
    ['소수', JSON.stringify({ ...cached, cashWon: 1.5 })],
    ['문자열 cashWon', JSON.stringify({ ...cached, cashWon: '5000' })],
    ['cashWon 없음', JSON.stringify({ asOf: cached.asOf, source: cached.source })],
    ['잘못된 source', JSON.stringify({ ...cached, source: 'kis2' })],
    ['잘못된 asOf', JSON.stringify({ ...cached, asOf: '2026/10/24' })],
  ] as Array<[string, string]>)('%s 저장값은 무시한다', (_label, raw) => {
    expect(parseCachedCash(raw)).toBeNull()
  })
})
