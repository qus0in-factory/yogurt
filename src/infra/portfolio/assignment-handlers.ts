import type { Context } from 'hono'
import { productCodeSchema } from '../../domain/accounts/products.ts'
import { portfolioAssignmentRequestSchema } from '../../domain/portfolio/assignment'
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
  if (!productCodeSchema.safeParse(productCode).success) {
    return c.json({ error: 'invalid request', code: 'INVALID_ASSIGNMENT', issues: INVALID_CODE }, 400)
  }
  const parsed = portfolioAssignmentRequestSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: 'invalid request', code: 'INVALID_ASSIGNMENT', issues: issuesOf(parsed.error) }, 400)
  if (!(await portfolioExists(db, parsed.data.portfolioId))) {
    return c.json({ error: 'portfolio not found', code: 'PORTFOLIO_NOT_FOUND' }, 404)
  }
  if (!(await targetExists(db, accountId, productCode))) {
    return c.json({ error: 'target not found', code: 'TARGET_NOT_FOUND' }, 404)
  }
  return c.json(await assignTarget(db, accountId, productCode, parsed.data.portfolioId), 200)
}

export async function unassignTargetHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const accountId = c.req.param('accountId') ?? ''
  const productCode = c.req.param('productCode') ?? ''
  if (!productCodeSchema.safeParse(productCode).success) {
    return c.json({ error: 'invalid request', code: 'INVALID_ASSIGNMENT', issues: INVALID_CODE }, 400)
  }
  await unassignTarget(db, accountId, productCode)
  return c.body(null, 204)
}
