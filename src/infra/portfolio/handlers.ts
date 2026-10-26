import type { Context } from 'hono'
import { portfolioDraftSchema } from '../../domain/portfolio/portfolio'
import { issuesOf } from './errors.ts'
import { assignmentCount, createPortfolio, getPortfolio, listPortfolios, removePortfolio, updatePortfolio } from './repository.ts'

type Ctx = Context<{ Bindings: Env }>

const NO_STORAGE = { error: 'portfolio storage is not configured', code: 'STORAGE_UNAVAILABLE' }

export async function listPortfoliosHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  return c.json(await listPortfolios(db), 200)
}

export async function createPortfolioHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const parsed = portfolioDraftSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'invalid request', code: 'INVALID_PORTFOLIO', issues: issuesOf(parsed.error) }, 400)
  const id = crypto.randomUUID()
  await createPortfolio(db, parsed.data, new Date().toISOString(), id)
  return c.json(await getPortfolio(db, id), 201)
}

export async function updatePortfolioHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const parsed = portfolioDraftSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'invalid request', code: 'INVALID_PORTFOLIO', issues: issuesOf(parsed.error) }, 400)
  const id = c.req.param('portfolioId') ?? ''
  if (!(await getPortfolio(db, id))) return c.json({ error: 'portfolio not found', code: 'PORTFOLIO_NOT_FOUND' }, 404)
  await updatePortfolio(db, id, parsed.data, new Date().toISOString())
  return c.json(await getPortfolio(db, id), 200)
}

export async function deletePortfolioHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const id = c.req.param('portfolioId') ?? ''
  if (!(await getPortfolio(db, id))) return c.json({ error: 'portfolio not found', code: 'PORTFOLIO_NOT_FOUND' }, 404)
  const assigned = await assignmentCount(db, id)
  if (assigned > 0) {
    return c.json({ error: 'portfolio is in use', code: 'PORTFOLIO_IN_USE', assignedCount: assigned }, 409)
  }
  await removePortfolio(db, id)
  return c.body(null, 204)
}
