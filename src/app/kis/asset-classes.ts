import type { AccountAssets } from './account-assets-client'

export const ASSET_CLASS_LABELS = { 0: 'stock', 1: 'fund', 8: 'cash' } as const

export function splitTotalRow(rows: AssetRow[]) {
  return { items: rows.slice(0, -1), total: rows.at(-1) ?? null }
}

type AssetRow = AccountAssets['rows'][number]
type AssetClassLabel = (typeof ASSET_CLASS_LABELS)[keyof typeof ASSET_CLASS_LABELS]

function hasValues(row: AssetRow) {
  return [row.purchaseAmount, row.evaluationAmount, row.profitLoss,
    row.creditLoan, row.netAssets, row.weight].some((value) => value !== 0)
}

export function classifyAssetRows(rows: AssetRow[]) {
  const { items: rowsWithoutTotal, total } = splitTotalRow(rows)
  const totalAmount = total?.evaluationAmount ?? 0
  const items = rowsWithoutTotal.filter(hasValues).map((row) => ({
    index: row.index,
    label: (ASSET_CLASS_LABELS as Record<number, AssetClassLabel>)[row.index] ?? null,
    evaluationAmount: row.evaluationAmount,
    weight: totalAmount === 0 ? 0 : Math.round(row.evaluationAmount / totalAmount * 10000) / 100,
  }))
  return { items, total }
}

export function fundEvaluation(rows: AssetRow[]) {
  const { items } = splitTotalRow(rows)
  const fund = items.find((row) => (ASSET_CLASS_LABELS as Record<number, AssetClassLabel>)[row.index] === 'fund')
  return fund?.evaluationAmount ?? 0
}
