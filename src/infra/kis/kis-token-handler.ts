import type { Context } from 'hono'
import { kisClientFromEnv } from './kis-context.ts'

type AppContext = Context<{ Bindings: Env }>

export async function kisTokenHandler(c: AppContext, fetchFn: typeof fetch = fetch): Promise<Response> {
  const client = kisClientFromEnv(c, fetchFn)
  if (!client) return c.json({ error: 'kis token dependencies are not configured' }, 503)
  const account = await client.forAccount(c.req.param('id') as string)
  if (!account) return c.json({ error: 'account not found' }, 404)
  try {
    const result = await account.ensureToken()
    return c.json(result, 200)
  } catch {
    return c.json({ error: 'kis token failed' }, 502)
  }
}
