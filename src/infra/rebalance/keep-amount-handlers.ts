import type { Context } from 'hono'
import { keepAmountProductCodeSchema, keepAmountRequestSchema } from '../../domain/rebalance/keep-amount'
import { getKeepAmount, keepAmountTargetExists, saveKeepAmount } from './keep-amount-repository.ts'

type Ctx = Context<{ Bindings: Env }>

const NO_STORAGE = { error: 'keep amount storage is not configured', code: 'STORAGE_UNAVAILABLE' }
const INVALID = { error: 'invalid request', code: 'INVALID_KEEP_AMOUNT' }
const NOT_FOUND = { error: 'target not found', code: 'TARGET_NOT_FOUND' }

const codeOf = (c: Ctx) => keepAmountProductCodeSchema.safeParse(c.req.param('productCode') ?? '')

export async function getKeepAmountHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const code = codeOf(c)
  if (!code.success) return c.json(INVALID, 400)
  const accountId = c.req.param('accountId') ?? ''
  try {
    if (!(await keepAmountTargetExists(db, accountId, code.data))) return c.json(NOT_FOUND, 404)
    return c.json({ keepAmount: await getKeepAmount(db, accountId, code.data) }, 200)
  } catch {
    return c.json(NO_STORAGE, 503)
  }
}

export async function saveKeepAmountHandler(c: Ctx): Promise<Response> {
  const db = c.env.DB
  if (!db) return c.json(NO_STORAGE, 503)
  const code = codeOf(c)
  if (!code.success) return c.json(INVALID, 400)
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json(INVALID, 400)
  }
  const parsed = keepAmountRequestSchema.safeParse(body)
  if (!parsed.success) return c.json(INVALID, 400)
  const accountId = c.req.param('accountId') ?? ''
  try {
    if (!(await keepAmountTargetExists(db, accountId, code.data))) return c.json(NOT_FOUND, 404)
    await saveKeepAmount(db, accountId, code.data, parsed.data.keepAmount)
    return c.json({ keepAmount: parsed.data.keepAmount }, 200)
  } catch {
    return c.json(NO_STORAGE, 503)
  }
}
