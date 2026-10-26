import type { PortfolioDraft } from '../../../domain/portfolio/portfolio'

export type EditorItem = {
  id: string
  kind: 'security' | 'cash'
  stockCode: string
  stockName: string
  weightPercent: string
}

export type RowErrors = {
  stockCode?: string
  stockName?: string
  weight?: string
}

export type PortfolioEditorProps = {
  open: boolean
  onClose: () => void
  onSubmit: (draft: PortfolioDraft) => void
  initialValue?: PortfolioDraft
  assignedCount?: number
  serverError?: string
}
