import { describe, expect, it } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month'
import { isHoldingsFresh, parseStoredHoldings, resolveHoldings } from '../../../src/domain/kis/holdings-fallback'

// resolveHoldings returns response-facing fields; a cached asOf older than 7 days must be ignored.
const h = (evaluationAmount = 800000) => ({
  code: '005930', name: '삼성전자', quantity: 10, averagePrice: 70000, purchaseAmount: 700000,
  currentPrice: 80000, evaluationAmount, profitLoss: 100000, profitLossRate: 14.28,
})
const asOf = '2026-10-25 10:00'
const cachedAsOf = seoulDateTime(new Date(Date.now() - 86400000))
const stored = { holdings: [h()], stockEvaluationWon: 800000, asOf: cachedAsOf }
const unavailable = {
  holdings: [], holdingsSource: null, holdingsAsOf: null,
  holdingsFallback: false, holdingsUnavailable: true, holdingsPartialWarning: false,
}

describe('resolveHoldings', () => {
  it('KIS 보유가 있으면 KIS 값을 쓰고 캐시를 대체로 쓰지 않는다', () => {
    expect(resolveHoldings([h()], 800000, stored, asOf)).toMatchObject({
      holdings: [h()], holdingsSource: 'kis', holdingsAsOf: asOf, holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: false,
    })
  })
  it('KIS 보유가 없고 신선한 캐시가 있으면 캐시 보유를 쓴다', () => {
    expect(resolveHoldings([], 800000, stored, asOf)).toMatchObject({
      holdings: stored.holdings, holdingsSource: 'kv', holdingsAsOf: cachedAsOf, holdingsFallback: true, holdingsUnavailable: false, holdingsPartialWarning: false,
    })
  })
  it('KIS 보유가 없고 캐시도 없으면 사용할 수 없다', () => {
    expect(resolveHoldings([], 800000, null, asOf)).toMatchObject(unavailable)
  })
  it('주식평가가 0인 현금 전용 계좌는 누락이 아니다', () => {
    const resolved = resolveHoldings([], 0, stored, asOf)
    expect(resolved).toMatchObject({
      holdings: [], holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: false,
    })
    expect(resolved.holdingsSource).not.toBe('kv')
  })
  it('수량과 평가액이 모두 0인 행은 보유로 치지 않고 캐시를 쓴다', () => {
    const empty = { ...h(0), quantity: 0 }
    expect(resolveHoldings([empty], 800000, stored, asOf)).toMatchObject({
      holdings: stored.holdings, holdingsSource: 'kv', holdingsFallback: true,
    })
  })
  it('보유 합계가 요약과 5% 이상 다르면 경고만 하고 대체하지 않는다', () => {
    expect(resolveHoldings([h(700000)], 800000, stored, asOf)).toMatchObject({
      holdings: [h(700000)], holdingsSource: 'kis', holdingsAsOf: asOf, holdingsFallback: false, holdingsUnavailable: false, holdingsPartialWarning: true,
    })
  })
  it('정확히 5% 차이도 경고한다', () => {
    expect(resolveHoldings([h(760000)], 800000, null, asOf).holdingsPartialWarning).toBe(true)
  })
})

describe('parseStoredHoldings', () => {
  it('유효한 저장값을 그대로 돌려준다', () => {
    expect(parseStoredHoldings(JSON.stringify(stored))).toMatchObject(stored)
  })
  it.each([
    ['깨진 JSON', '{bad'],
    ['음수 평가액', JSON.stringify({ ...stored, stockEvaluationWon: -1 })],
    ['소수 평가액', JSON.stringify({ ...stored, stockEvaluationWon: 1.5 })],
    ['잘못된 asOf', JSON.stringify({ ...stored, asOf: '2026/10/24' })],
    ['holdings 배열 아님', JSON.stringify({ ...stored, holdings: 'x' })],
  ] as Array<[string, string]>)('%s 저장값은 무시한다', (_label, raw) => {
    expect(parseStoredHoldings(raw)).toBeNull()
  })
})

describe('isHoldingsFresh', () => {
  const now = new Date('2026-10-25T01:00:00Z')
  const daysBefore = (days: number) => seoulDateTime(new Date(now.getTime() - days * 86400000))
  it('7일 이내 저장값은 신선하다', () => {
    expect(isHoldingsFresh(daysBefore(6), now)).toBe(true)
  })
  it('7일이 지난 저장값은 무시한다', () => {
    expect(isHoldingsFresh(daysBefore(8), now)).toBe(false)
  })
})
