import { Hono, type Context } from 'hono'
import { seoulDateTime } from '../../domain/accounts/snapshot-month.ts'
import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item.ts'
import { createAccountRepository } from '../accounts/account-repository.ts'
import { kisClientFromEnv } from '../kis/kis-context.ts'
import { KisStockNotFoundError, lookupStockName } from '../kis/kis-stock-lookup.ts'
import { readStockName, writeStockName } from './stock-name-store.ts'

type AppContext = Context<{ Bindings: Env }>

export async function lookupStockHandler(
  c: AppContext,
  fetchFn: typeof fetch = fetch,
): Promise<Response> {
  const rawCode = c.req.param('code') ?? ''
  const code = rawCode.trim().toUpperCase()
  if (!STOCK_CODE_PATTERN.test(code)) {
    return c.json({ error: 'invalid stock code', code: 'INVALID_STOCK_CODE' }, 400)
  }

  const cache = c.env.CACHE
  if (cache) {
    const cached = await readStockName(cache, code)
    if (cached) return c.json({ code, name: cached.name }, 200)
  }

  if (!c.env.DB) {
    return c.json({ error: 'stock lookup is unavailable', code: 'STOCK_LOOKUP_UNAVAILABLE' }, 503)
  }

  let accounts
  try {
    accounts = await createAccountRepository(c.env.DB).list()
  } catch {
    return c.json({ error: 'stock lookup is unavailable', code: 'STOCK_LOOKUP_UNAVAILABLE' }, 503)
  }

  const firstAccount = accounts[0]
  if (!firstAccount) {
    return c.json({ error: 'no kis account configured', code: 'NO_KIS_ACCOUNT' }, 503)
  }

  const kisClient = kisClientFromEnv(c, fetchFn)
  if (!kisClient) {
    return c.json({ error: 'stock lookup is unavailable', code: 'STOCK_LOOKUP_UNAVAILABLE' }, 503)
  }

  try {
    const accountClient = await kisClient.forAccount(firstAccount.id)
    if (!accountClient) {
      return c.json({ error: 'no kis account configured', code: 'NO_KIS_ACCOUNT' }, 503)
    }
    const name = await lookupStockName(accountClient, code)
    if (cache) {
      await writeStockName(cache, code, { name, asOf: seoulDateTime(new Date()) })
    }
    return c.json({ code, name }, 200)
  } catch (error) {
    if (error instanceof KisStockNotFoundError) {
      return c.json({ error: 'stock not found', code: 'STOCK_NOT_FOUND' }, 404)
    }
    return c.json({ error: 'stock lookup is unavailable', code: 'STOCK_LOOKUP_UNAVAILABLE' }, 503)
  }
}

export function createStockRoutes(fetchFn: typeof fetch = fetch) {
  const routes = new Hono<{ Bindings: Env }>()
  routes.get('/stocks/:code', (c) => lookupStockHandler(c, fetchFn))
  return routes
}

export const stockRoutes = createStockRoutes()

// worker 등록 한 줄 유지를 위한 재노출. 구현은 trading 모듈에 있다.
export { orderRoutes } from '../trading/order-routes.ts'
