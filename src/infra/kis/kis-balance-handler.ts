import type { Context } from 'hono'
import { productCodeSchema } from '../../domain/accounts/products.ts'
import { kisClientFromEnv } from './kis-context.ts'
import { KisApiError, fetchStockBalance } from './kis-stock-balance.ts'

type AppContext = Context<{ Bindings: Env }>

export async function kisBalanceHandler(c: AppContext, fetchFn: typeof fetch = fetch): Promise<Response> {
  const code = productCodeSchema.safeParse(c.req.param('code'))
  if (!code.success) return c.json({ error: 'invalid product code' }, 400)
  const client = kisClientFromEnv(c, fetchFn)
  if (!client) return c.json({ error: 'kis balance dependencies are not configured' }, 503)
  const account = await client.forAccount(c.req.param('id') as string)
  if (!account) return c.json({ error: 'account not found' }, 404)
  try {
    return c.json(await fetchStockBalance(account, code.data), 200)
  } catch (error) {
    const codeFailed = error instanceof KisApiError ? error.code : undefined
    return c.json({ error: 'kis request failed', ...(codeFailed ? { code: codeFailed } : {}) }, 502)
  }
}
