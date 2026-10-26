import type { Context } from 'hono'
import { portfolioAssignmentRequestSchema, portfolioProductCodeSchema } from '../../domain/portfolio/assignment'
import { assignTarget, listAssignments, portfolioExists, targetExists, unassignTarget } from './assignment-repository.ts'
import { issuesOf } from './errors.ts'

type Ctx = Context<{ Bindings: Env }>

const NO_STORAGE = { error: 'portfolio storage is not configured', code: 'STORAGE_UNAVAILABLE' }
const INVALID_CODE = [{ path: 'productCode', reason: 'INVALID_PRODUCT_CODE' }]

export async function listAssignmentsHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  return c.json(await listAssignments(db), 200)
}

export async function assignTargetHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const accountId = c.req.param('accountId') ?? ''
  const productCode = c.req.param('productCode') ?? ''
  const code = portfolioProductCodeSchema.safeParse(productCode)
  if (!code.success) {
    return c.json({ error: 'invalid request', code: 'INVALID_ASSIGNMENT', issues: INVALID_CODE }, 400)
  }
  const parsed = portfolioAssignmentRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'invalid request', code: 'INVALID_ASSIGNMENT', issues: issuesOf(parsed.error) }, 400)
  if (!(await portfolioExists(db, parsed.data.portfolioId))) {
    return c.json({ error: 'portfolio not found', code: 'PORTFOLIO_NOT_FOUND' }, 404)
  }
  if (!(await targetExists(db, accountId, code.data))) {
    return c.json({ error: 'target not found', code: 'TARGET_NOT_FOUND' }, 404)
  }
  return c.json(await assignTarget(db, accountId, code.data, parsed.data.portfolioId), 200)
}

export async function unassignTargetHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const accountId = c.req.param('accountId') ?? ''
  const productCode = c.req.param('productCode') ?? ''
  const code = portfolioProductCodeSchema.safeParse(productCode)
  if (!code.success) {
    return c.json({ error: 'invalid request', code: 'INVALID_ASSIGNMENT', issues: INVALID_CODE }, 400)
  }
  await unassignTarget(db, accountId, code.data)
  return c.body(null, 204)
}
