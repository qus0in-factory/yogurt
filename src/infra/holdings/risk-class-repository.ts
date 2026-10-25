import type { RiskClass } from '../../domain/holdings/risk-class.ts'

type RiskClassRow = { stock_code: string; risk_class: RiskClass }

export function createRiskClassRepository(db: D1Database) {
  return {
    async list(accountId: string, productCode: string): Promise<Record<string, RiskClass> | null> {
      const account = await db.prepare('SELECT id FROM accounts WHERE id = ?').bind(accountId).first<{ id: string }>()
      if (!account) return null
      const { results = [] } = await db.prepare(
        'SELECT stock_code, risk_class FROM holding_risk_classes WHERE account_id = ? AND product_code = ?',
      ).bind(accountId, productCode).all<RiskClassRow>()
      const classes: Record<string, RiskClass> = {}
      for (const row of results) classes[row.stock_code] = row.risk_class
      return classes
    },
    async set(accountId: string, productCode: string, stockCode: string, riskClass: RiskClass): Promise<{ stockCode: string; riskClass: RiskClass } | null> {
      const result = await db.prepare(
        'INSERT INTO holding_risk_classes (account_id, product_code, stock_code, risk_class) SELECT id, ?, ?, ? FROM accounts WHERE id = ? ON CONFLICT (account_id, product_code, stock_code) DO UPDATE SET risk_class = excluded.risk_class',
      ).bind(productCode, stockCode, riskClass, accountId).run()
      return result.meta.changes > 0 ? { stockCode, riskClass } : null
    },
  }
}
