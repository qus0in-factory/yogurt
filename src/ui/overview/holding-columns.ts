import { overviewText as text } from '../glossary/overview'

export type HoldingColumnId = 'name' | 'quantity' | 'evaluation' | 'profitLoss' | 'profitRate' | 'weight' | 'risk'
type HoldingColumn = { id: HoldingColumnId; label: string; align: 'left' | 'right' }

const columns: HoldingColumn[] = [
  { id: 'name', label: text.name, align: 'left' },
  { id: 'quantity', label: text.quantity, align: 'right' },
  { id: 'evaluation', label: text.evaluation, align: 'right' },
  { id: 'profitLoss', label: text.profitLoss, align: 'right' },
  { id: 'profitRate', label: text.profitRate, align: 'right' },
  { id: 'weight', label: text.weight, align: 'right' },
]

export function holdingColumns(showRisk: boolean): HoldingColumn[] {
  return showRisk ? [...columns, { id: 'risk', label: text.riskClass, align: 'right' }] : columns
}
