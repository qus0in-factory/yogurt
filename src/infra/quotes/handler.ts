import type { Context } from 'hono'
import { STOCK_CODE_PATTERN } from '../../domain/portfolio/item'
import { createAccountRepository } from '../accounts/account-repository'
import { kisClientFromEnv } from '../kis/kis-context'
import { cachedQuote } from './cache'
import { inquirePrice, QuoteError } from './price'
export async function quoteHandler(c: Context<{ Bindings: Env }>, fetchFn: typeof fetch): Promise<Response> {
  const code = (c.req.param('code') ?? '').trim().toUpperCase()
  if (!STOCK_CODE_PATTERN.test(code)) return c.json({ code: 'INVALID_STOCK_CODE' }, 400)
  try {
    const quote = await cachedQuote(c.env.CACHE, code, async () => {
      if (!c.env.DB) throw new QuoteError(503)
      const account = (await createAccountRepository(c.env.DB).list())[0]
      const client = account && await kisClientFromEnv(c, fetchFn)?.forAccount(account.id)
      if (!client) throw new QuoteError(503)
      return inquirePrice(client, code)
    })
    return c.json(quote, 200)
  } catch (error) {
    const status = error instanceof QuoteError ? error.status : 503
    return c.json({ code: status === 404 ? 'STOCK_NOT_FOUND' : 'STOCK_LOOKUP_UNAVAILABLE' }, status)
  }
}
