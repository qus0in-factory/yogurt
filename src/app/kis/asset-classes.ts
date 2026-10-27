import type { AccountAssets } from './account-assets-client'

type AssetRow = AccountAssets['rows'][number]
type AssetClassLabel = 'stock' | 'fund' | 'rp' | 'cash'

export const ASSET_CLASS_LABELS: Record<string, Record<number, AssetClassLabel>> = {
  '22': { 0: 'stock', 1: 'fund', 8: 'cash' },
  '01': { 0: 'stock', 7: 'rp', 17: 'cash' },
}

const labelsFor = (productCode: string) => ASSET_CLASS_LABELS[productCode] ?? {}

export function splitTotalRow(rows: AssetRow[]) {
  return { items: rows.slice(0, -1), total: rows.at(-1) ?? null }
}

function hasValues(row: AssetRow) {
  return [row.purchaseAmount, row.evaluationAmount, row.profitLoss,
    row.creditLoan, row.netAssets, row.weight].some((value) => value !== 0)
}

export function classifyAssetRows(rows: AssetRow[], productCode = '22', cashD2?: number) {
  const { items: rowsWithoutTotal, total } = splitTotalRow(rows)
  const labels = labelsFor(productCode)
  const cashRow = rowsWithoutTotal.find((row) => labels[row.index] === 'cash')
  const cashValue = cashD2 ?? cashRow?.evaluationAmount ?? 0
  const totalAmount = total ? total.evaluationAmount - (cashRow?.evaluationAmount ?? 0) + cashValue : 0
  const items = rowsWithoutTotal.map((row) => ({
    ...row, label: labels[row.index] ?? null,
    evaluationAmount: labels[row.index] === 'cash' ? cashValue : row.evaluationAmount,
  })).filter(hasValues).map((row) => ({
    index: row.index, label: row.label, evaluationAmount: row.evaluationAmount,
    weight: totalAmount === 0 ? 0 : Math.round(row.evaluationAmount / totalAmount * 10000) / 100,
  }))
  return { items, total: total && cashD2 !== undefined ? { ...total, evaluationAmount: totalAmount, weight: 100 } : total }
}

export function rpEvaluation(rows: AssetRow[], productCode = '22') {
  const labels = labelsFor(productCode)
  return splitTotalRow(rows).items
    .filter((row) => labels[row.index] === 'rp')
    .reduce((sum, row) => sum + row.evaluationAmount, 0)
}

export function fundEvaluation(rows: AssetRow[], productCode = '22') {
  const { items } = splitTotalRow(rows)
  const labels = labelsFor(productCode)
  const fund = items.find((row) => labels[row.index] === 'fund')
  return fund?.evaluationAmount ?? 0
}
