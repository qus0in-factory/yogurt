import { Hono } from 'hono'
import { MARKET_HOLIDAYS } from '../../domain/market/holidays.ts'
import { isMarketOpen } from '../../domain/market/session.ts'

export const marketRoutes = new Hono<{ Bindings: Env }>()
marketRoutes.get('/market/status', (c) => c.json(isMarketOpen(new Date(), MARKET_HOLIDAYS)))
