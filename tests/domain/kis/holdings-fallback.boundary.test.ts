import { expect, it } from 'vitest'
import { activeHoldings, resolveHoldings } from '../../../src/domain/kis/holdings-fallback'

const h = (quantity: number, evaluationAmount: number) => ({
  code: 'A', name: '종목', quantity, evaluationAmount, averagePrice: 0,
  purchaseAmount: 0, currentPrice: 0, profitLoss: 0, profitLossRate: 0,
})
const asOf = '2026-10-25 10:00'

it('수량 0이고 평가금액만 양수인 종목은 activeHoldings에서 제외된다', () => {
  const rows = [h(1, 0), h(0, 1), h(0, 0), h(-1, -1)]
  const before = structuredClone(rows)
  expect(activeHoldings(rows)).toEqual([rows[0]])
  expect(rows).toEqual(before)
  expect(activeHoldings([])).toEqual([])
})

it('수량 0 종목과 정상 종목이 섞이면 정상 종목만 남는다', () => {
  const normal = h(10, 1000)
  const zeroQty = h(0, 500)
  expect(activeHoldings([normal, zeroQty])).toEqual([normal])
  expect(resolveHoldings([normal, zeroQty], 1000, null, asOf)).toMatchObject({
    holdings: [normal], holdingsSource: 'kis', holdingsFallback: false,
  })
})

it('저장값(cached)에 수량 0 종목이 있어도 대체 결과에서 빠진다', () => {
  const valid = h(5, 500)
  const zeroQty = h(0, 300)
  const cached = { holdings: [valid, zeroQty], stockEvaluationWon: 500, asOf }
  expect(resolveHoldings([], 500, cached, asOf)).toMatchObject({
    holdings: [valid], holdingsSource: 'kv', holdingsFallback: true,
  })
})

it('수량 0 종목만 관측되면 활성 종목 0개로 처리되어 캐시를 대체로 쓴다', () => {
  const zeroQty = h(0, 500)
  const cached = { holdings: [h(5, 500)], stockEvaluationWon: 500, asOf }
  expect(resolveHoldings([zeroQty], 500, cached, asOf)).toMatchObject({
    holdings: cached.holdings, holdingsSource: 'kv', holdingsFallback: true,
  })
})

it.each([[951, false], [1049, false], [1050, true], [1051, true]] as const)(
  '평가액 %i의 절대 차이 5%% 경고는 %s', (amount, warning) => {
    expect(resolveHoldings([h(1, amount)], 1000, null, asOf)).toMatchObject({
      holdingsSource: 'kis', holdingsFallback: false, holdingsPartialWarning: warning,
    })
  },
)

it('캐시에서도 비활성 행을 제외한 합계로 부분 누락을 판정한다', () => {
  const live = h(1, 900)
  const cached = { holdings: [live, h(0, 0)], stockEvaluationWon: 1000, asOf }
  expect(resolveHoldings([], 1000, cached, asOf)).toMatchObject({
    holdings: [live], holdingsSource: 'kv', holdingsFallback: true,
    holdingsPartialWarning: true, holdingsUnavailable: false,
  })
})

it('요약 평가액이 0이어도 실제 관측 보유를 버리지 않는다', () => {
  expect(resolveHoldings([h(1, 0)], 0, null, asOf)).toMatchObject({
    holdings: [h(1, 0)], holdingsSource: 'kis', holdingsPartialWarning: false,
  })
})
