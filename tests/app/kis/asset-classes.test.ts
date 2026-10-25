import { expect, it } from 'vitest'
import { classifyAssetRows, fundEvaluation, splitTotalRow } from '../../../src/app/kis/asset-classes'

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

it('finds fund evaluation by confirmed class, excluding the total row', () => {
  expect(fundEvaluation([row(0, 1000), row(1, 2000), row(9, 3000)])).toBe(2000)
  expect(fundEvaluation([row(0, 1000), row(1, 0), row(9, 1000)])).toBe(0)
  expect(fundEvaluation([row(0, 1000), row(1, 2000)])).toBe(0)
})
