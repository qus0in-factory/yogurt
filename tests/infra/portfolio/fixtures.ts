import { Hono } from 'hono'
import { portfolioRoutes } from '../../../src/infra/portfolio/routes.ts'

export type Call = { sql: string; args: unknown[] }

export const draft = {
  name: '중립형 목표',
  items: [
    { kind: 'security' as const, stockCode: '123456', stockName: '예시 ETF', targetWeightBps: 6000 },
    { kind: 'cash' as const, stockCode: null, stockName: '현금/예수금', targetWeightBps: 4000 },
  ],
}

export const portfolio = {
  id: 'p1', name: '중립형 목표', items: draft.items,
  createdAt: '2026-10-26T00:00:00.000Z', updatedAt: '2026-10-26T00:00:00.000Z',
}

export function fakeDb(tables: { portfolios?: unknown[]; items?: unknown[]; target?: unknown } = {}) {
  const calls: Call[] = []
  const resultsFor = (sql: string) => sql.includes('FROM portfolio_items') ? (tables.items ?? [])
    : sql.includes('FROM portfolios') ? (tables.portfolios ?? [])
      : sql.includes('FROM account_products') ? (tables.target ? [tables.target] : []) : []
  const db = {
    prepare(sql: string) {
      const stmt = {
        bind: (...args: unknown[]) => {
          calls.push({ sql, args })
          return {
            all: async () => ({ results: resultsFor(sql) }),
            first: async () => (sql.includes('COUNT(*)') ? { count: 3 } : resultsFor(sql)[0] ?? null),
            run: async () => ({ success: true, meta: { changes: 1 } }),
          }
        },
        all: async () => { calls.push({ sql, args: [] }); return { results: resultsFor(sql) } },
        first: async () => { calls.push({ sql, args: [] }); return resultsFor(sql)[0] ?? null },
        run: async () => { calls.push({ sql, args: [] }); return { success: true, meta: { changes: 1 } } },
      }
      return stmt
    },
    batch: async (statements: unknown[]) => {
      calls.push({ sql: 'BATCH', args: [statements.length] })
      return []
    },
  } as unknown as D1Database
  return { db, calls }
}

export const app = new Hono<{ Bindings: Env }>().route('/api', portfolioRoutes)
export const env = { DB: {} } as unknown as Env
export const call = (path: string, method: string, body?: unknown) => app.request(path, {
  method, headers: body ? { 'Content-Type': 'application/json' } : {},
  body: body ? JSON.stringify(body) : undefined,
}, env)
