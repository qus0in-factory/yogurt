import type { PortfolioDraft } from '../../domain/portfolio/portfolio'
import type { Portfolio } from '../../domain/portfolio/portfolio'
import { deleteItemsStatement, headerStatement, itemStatements, updateHeaderStatement } from './item-repository.ts'
import { toItem, toPortfolio, type ItemRow, type PortfolioRow } from './rows.ts'

const LIST = 'SELECT id, name, created_at, updated_at FROM portfolios ORDER BY name ASC, created_at ASC'
const ITEMS = 'SELECT portfolio_id, position, kind, stock_code, stock_name, target_weight_bps FROM portfolio_items WHERE portfolio_id = ? ORDER BY position ASC'

export async function listPortfolios(db: D1Database): Promise<Portfolio[]> {
  const { results = [] } = await db.prepare(LIST).all<PortfolioRow>()
  const portfolios = await Promise.all(results.map(async (row) => toPortfolio(row, await itemsOf(db, row.id))))
  return portfolios
}

export async function getPortfolio(db: D1Database, id: string): Promise<Portfolio | null> {
  const row = await db.prepare(`${LIST.replace('ORDER BY name ASC, created_at ASC', 'WHERE id = ?')}`).bind(id).first<PortfolioRow>()
  if (!row) return null
  return toPortfolio(row, await itemsOf(db, id))
}

export async function createPortfolio(db: D1Database, draft: PortfolioDraft, now: string, id: string): Promise<void> {
  await db.batch([headerStatement(db, id, draft, now), ...itemStatements(db, id, draft.items)])
}

export async function updatePortfolio(db: D1Database, id: string, draft: PortfolioDraft, now: string): Promise<void> {
  await db.batch([updateHeaderStatement(db, id, draft, now), deleteItemsStatement(db, id), ...itemStatements(db, id, draft.items)])
}

export async function removePortfolio(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM portfolios WHERE id = ?').bind(id).run()
}

export async function assignmentCount(db: D1Database, id: string): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS count FROM portfolio_assignments WHERE portfolio_id = ?').bind(id).first<{ count: number }>()
  return Number(row?.count ?? 0)
}

async function itemsOf(db: D1Database, id: string) {
  const { results = [] } = await db.prepare(ITEMS).bind(id).all<ItemRow>()
  return results.map(toItem)
}
