import type { PortfolioItem } from '../../domain/portfolio/item'
import type { Portfolio } from '../../domain/portfolio/portfolio'

export type PortfolioRow = { id: string; name: string; created_at: string; updated_at: string }
export type ItemRow = {
  portfolio_id: string; position: number; kind: string
  stock_code: string | null; stock_name: string; target_weight_bps: number
}
export type AssignmentRow = { account_id: string; product_code: string; portfolio_id: string }

export function toItem(row: ItemRow): PortfolioItem {
  return {
    kind: row.kind === 'cash' ? 'cash' : 'security',
    stockCode: row.stock_code,
    stockName: row.stock_name,
    targetWeightBps: row.target_weight_bps,
  }
}

export function toPortfolio(row: PortfolioRow, items: PortfolioItem[]): Portfolio {
  return {
    id: row.id,
    name: row.name,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toAssignment(row: AssignmentRow) {
  return { accountId: row.account_id, productCode: row.product_code, portfolioId: row.portfolio_id }
}
