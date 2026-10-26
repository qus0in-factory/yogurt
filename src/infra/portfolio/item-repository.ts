import type { PortfolioDraft } from '../../domain/portfolio/portfolio'
import type { PortfolioItem } from '../../domain/portfolio/item'

const INSERT_ITEM = `INSERT INTO portfolio_items
  (portfolio_id, position, kind, stock_code, stock_name, target_weight_bps) VALUES (?, ?, ?, ?, ?, ?)`

export function itemStatements(db: D1Database, portfolioId: string, items: PortfolioItem[]) {
  return items.map((item, index) => db.prepare(INSERT_ITEM).bind(
    portfolioId,
    index,
    item.kind,
    item.stockCode,
    item.stockName,
    item.targetWeightBps,
  ))
}

export function headerStatement(db: D1Database, id: string, draft: PortfolioDraft, now: string) {
  return db.prepare(
    'INSERT INTO portfolios (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
  ).bind(id, draft.name, now, now)
}

export function updateHeaderStatement(db: D1Database, id: string, draft: PortfolioDraft, now: string) {
  return db.prepare('UPDATE portfolios SET name = ?, updated_at = ? WHERE id = ?').bind(draft.name, now, id)
}

export function deleteItemsStatement(db: D1Database, id: string) {
  return db.prepare('DELETE FROM portfolio_items WHERE portfolio_id = ?').bind(id)
}
