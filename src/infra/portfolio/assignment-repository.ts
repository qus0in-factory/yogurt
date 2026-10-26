import type { PortfolioAssignment } from '../../domain/portfolio/assignment'
import { toAssignment, type AssignmentRow } from './rows.ts'

const LIST = 'SELECT account_id, product_code, portfolio_id FROM portfolio_assignments ORDER BY account_id ASC, product_code ASC'
const TARGET = 'SELECT account_id FROM account_products WHERE account_id = ? AND product_code = ?'
const UPSERT = `INSERT INTO portfolio_assignments (account_id, product_code, portfolio_id) VALUES (?, ?, ?)
  ON CONFLICT(account_id, product_code) DO UPDATE SET portfolio_id = excluded.portfolio_id`

export async function listAssignments(db: D1Database): Promise<PortfolioAssignment[]> {
  const { results = [] } = await db.prepare(LIST).all<AssignmentRow>()
  return results.map(toAssignment)
}

export async function targetExists(db: D1Database, accountId: string, productCode: string): Promise<boolean> {
  const row = await db.prepare(TARGET).bind(accountId, productCode).first<{ account_id: string }>()
  return Boolean(row)
}

export async function portfolioExists(db: D1Database, portfolioId: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM portfolios WHERE id = ?').bind(portfolioId).first<{ id: string }>()
  return Boolean(row)
}

export async function assignTarget(
  db: D1Database,
  accountId: string,
  productCode: string,
  portfolioId: string,
): Promise<PortfolioAssignment> {
  await db.prepare(UPSERT).bind(accountId, productCode, portfolioId).run()
  return { accountId, productCode, portfolioId }
}

export async function unassignTarget(db: D1Database, accountId: string, productCode: string): Promise<void> {
  await db.prepare('DELETE FROM portfolio_assignments WHERE account_id = ? AND product_code = ?').bind(accountId, productCode).run()
}
