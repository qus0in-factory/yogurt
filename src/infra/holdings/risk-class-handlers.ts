import type { Context } from 'hono'
import { productCodeSchema } from '../../domain/accounts/products.ts'
import { stockCodeSchema, riskClassUpdateSchema } from '../../domain/holdings/risk-class.ts'
import { createRiskClassRepository } from './risk-class-repository.ts'

type AppContext = Context<{ Bindings: Env }>
const CONFIG_ERROR = { error: 'accounts storage is not configured' }
const INVALID_REQUEST = { error: 'invalid request' }
const NOT_FOUND = { error: 'account not found' }

export async function getRiskClassesHandler(c: AppContext): Promise<Response> {
  if (!c.env.DB) return c.json(CONFIG_ERROR, 503)
  const code = productCodeSchema.safeParse(c.req.param('code'))
  if (!code.success) return c.json(INVALID_REQUEST, 400)
  const classes = await createRiskClassRepository(c.env.DB).list(c.req.param('id') as string, code.data)
  if (!classes) return c.json(NOT_FOUND, 404)
  return c.json({ classes }, 200)
}

export async function setRiskClassHandler(c: AppContext): Promise<Response> {
  if (!c.env.DB) return c.json(CONFIG_ERROR, 503)
  const code = productCodeSchema.safeParse(c.req.param('code'))
  const stockCode = stockCodeSchema.safeParse(c.req.param('stockCode'))
  if (!code.success || !stockCode.success) return c.json(INVALID_REQUEST, 400)
  const body = await c.req.json().catch(() => null)
  const parsed = riskClassUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json(INVALID_REQUEST, 400)
  const result = await createRiskClassRepository(c.env.DB).set(
    c.req.param('id') as string, code.data, stockCode.data, parsed.data.riskClass,
  )
  if (!result) return c.json(NOT_FOUND, 404)
  return c.json(result, 200)
}
