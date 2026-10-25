import type { Context } from 'hono'
import { fetchAccountAssets } from './kis-account-assets.ts'
import { kisQueryHandler } from './kis-balance-handler.ts'

export function kisAssetsHandler(c: Context<{ Bindings: Env }>, fetchFn: typeof fetch = fetch): Promise<Response> {
  return kisQueryHandler(c, fetchFn, fetchAccountAssets)
}
