import { expect, it } from 'vitest'
import { activeHoldings, resolveHoldings } from '../../../src/domain/kis/holdings-fallback'

const h = (quantity: number, evaluationAmount: number) => ({
  code: 'A', name: '종목', quantity, evaluationAmount, averagePrice: 0,
  purchaseAmount: 0, currentPrice: 0, profitLoss: 0, profitLossRate: 0,
})
const asOf = '2026-10-25 10:00'

it('수량 또는 평가액만 양수여도 보유하며 입력을 변경하지 않는다', () => {
  const rows = [h(1, 0), h(0, 1), h(0, 0), h(-1, -1)]
  const before = structuredClone(rows)
  expect(activeHoldings(rows)).toEqual(rows.slice(0, 2))
  expect(rows).toEqual(before)
  expect(activeHoldings([])).toEqual([])
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
