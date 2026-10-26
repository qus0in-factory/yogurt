import { expect, it } from 'vitest'
import { isCashFresh, parseCachedCash, resolveCash } from '../../../src/domain/kis/cash-fallback'

const asOf = '2026-10-18 10:00'
const cached = { cashWon: 10, asOf, source: 'user' as const }

it.each([
  ['2026-10-25T01:00:00.000Z', true],
  ['2026-10-25T01:00:00.001Z', false],
  ['2026-10-18T00:59:59.999Z', false],
  ['2026-10-18T01:00:00.000Z', true],
])('현금 캐시 신선도 경계 %s → %s', (now, fresh) => {
  expect(isCashFresh(asOf, new Date(now))).toBe(fresh)
})

it('해석 불가 시각은 현금 캐시로 사용하지 않는다', () => {
  expect(isCashFresh('invalid', new Date('2026-10-25T01:00:00Z'))).toBe(false)
})

it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
  '관측 현금 %s는 캐시가 있으면 대체하고 없으면 불가 상태다', (observed) => {
    expect(resolveCash(observed, cached, asOf)).toEqual({
      cash: 10, cashSource: 'user', cashAsOf: asOf, cashFallback: true, cashUnavailable: false,
    })
    expect(resolveCash(observed, null, asOf)).toEqual({
      cash: 0, cashSource: null, cashAsOf: null, cashFallback: false, cashUnavailable: true,
    })
  },
)

it.each(['null', '[]', '{}', '', 'true'])('잘못된 현금 저장값 %s', (raw) => {
  expect(parseCachedCash(raw)).toBeNull()
})

it('안전 정수 상한은 허용하고 그 다음 값은 거부한다', () => {
  const value = { ...cached, cashWon: Number.MAX_SAFE_INTEGER }
  expect(parseCachedCash(JSON.stringify(value))).toEqual(value)
  expect(parseCachedCash(JSON.stringify({ ...value, cashWon: value.cashWon + 1 }))).toBeNull()
  expect(resolveCash(value.cashWon, cached, asOf)).toMatchObject({
    cash: value.cashWon, cashSource: 'kis', cashFallback: false,
  })
})
