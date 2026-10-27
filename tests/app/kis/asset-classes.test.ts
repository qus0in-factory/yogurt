import { expect, it } from 'vitest'
import { classifyAssetRows, fundEvaluation, rpEvaluation, splitTotalRow } from '../../../src/app/kis/asset-classes'

type Row = { index: number; purchaseAmount: number; evaluationAmount: number; profitLoss: number; creditLoan: number; netAssets: number; weight: number }
const row = (index: number, amount: number): Row => ({ index, purchaseAmount: amount, evaluationAmount: amount, profitLoss: 0, creditLoan: 0, netAssets: amount, weight: 0 })

it('splits only the last row as total', () => {
  const rows = [row(0, 100), row(1, 200), row(8, 300)]
  expect(splitTotalRow(rows)).toEqual({ items: rows.slice(0, -1), total: rows[2] })
})

it('maps confirmed classes, excludes all-zero rows and computes weights from the last row', () => {
  const rows = [row(0, 1000), row(1, 2000), row(2, 0), row(8, 1000), row(9, 4000)]
  const result = classifyAssetRows(rows)
  expect(result.items.map(({ index, label, weight }) => [index, label, weight])).toEqual([
    [0, 'stock', 25], [1, 'fund', 50], [8, 'cash', 25],
  ])
  expect(result.total).toEqual(rows[4])
})

it('cashD2가 있으면 현금 행과 총액·비중을 D+2로 계산한다', () => {
  const rows = [row(0, 1000), row(8, 500), row(9, 1500)]
  const result = classifyAssetRows(rows, '22', 1000)
  expect(result.items.map(({ index, evaluationAmount, weight }) => [index, evaluationAmount, weight])).toEqual([
    [0, 1000, 50], [8, 1000, 50],
  ])
  expect(result.total).toMatchObject({ evaluationAmount: 2000, weight: 100 })
})

it('keeps unknown class labels null and uses zero weight when total is zero', () => {
  const result = classifyAssetRows([row(3, 5), row(4, 0)])
  expect(result.items[0]).toMatchObject({ index: 3, label: null, evaluationAmount: 5, weight: 0 })
})

it.each([7, 12])('treats the last of %i rows as total', (length) => {
  const rows = Array.from({ length }, (_, index) => row(index, 100))
  const result = classifyAssetRows(rows)
  expect(result.total).toEqual(rows[length - 1])
  expect(result.items).toHaveLength(length - 1)
})

it('uses an empty list and null total for empty input, and treats a last index 8 as total', () => {
  expect(classifyAssetRows([])).toEqual({ items: [], total: null })
  const result = classifyAssetRows(Array.from({ length: 9 }, (_, index) => row(index, 10)))
  expect(result.total?.index).toBe(8)
  expect(result.items.some((item) => item.index === 8)).toBe(false)
})

it('ISA는 상품 전용 매핑으로 0번 주식, 7번 RP, 17번 현금/예수금으로 분류한다', () => {
  const rows = [row(0, 200), row(7, 300), row(8, 100), row(17, 600), row(18, 1200)]
  const result = classifyAssetRows(rows, '01')
  expect(result.items.map(({ index, label }) => [index, label])).toEqual([[0, 'stock'], [7, 'rp'], [8, null], [17, 'cash']])
  expect(classifyAssetRows(rows).items.find((item) => item.index === 8)?.label).toBe('cash')
})

it('매핑이 없는 상품은 모든 행 라벨을 비워 둔다', () => {
  expect(classifyAssetRows([row(0, 10), row(1, 10), row(9, 20)], '29').items.map((item) => item.label)).toEqual([null, null])
})

it('RP 평가금액은 상품 매핑의 RP 행만 합산하고 총합 행은 제외한다', () => {
  expect(rpEvaluation([row(0, 100), row(7, 300), row(17, 600), row(18, 1000)], '01')).toBe(300)
  expect(rpEvaluation([row(0, 100), row(7, 300), row(9, 400)], '22')).toBe(0)
})

it('ISA에는 펀드 매핑이 없어 펀드 평가금액이 0이다', () => {
  expect(fundEvaluation([row(1, 2000), row(9, 2000)], '01')).toBe(0)
})

it('finds fund evaluation by confirmed class, excluding the total row', () => {
  expect(fundEvaluation([row(0, 1000), row(1, 2000), row(9, 3000)])).toBe(2000)
  expect(fundEvaluation([row(0, 1000), row(1, 0), row(9, 1000)])).toBe(0)
  expect(fundEvaluation([row(0, 1000), row(1, 2000)])).toBe(0)
})
