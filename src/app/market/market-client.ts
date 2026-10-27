import { z } from 'zod'
import { api } from '../http/http'
import type { MarketStatus } from '../../domain/market/session'

export const marketStatusSchema = z.object({
  open: z.boolean(),
  reason: z.enum(['open', 'closed-hours', 'weekend', 'holiday']),
  nextOpenAt: z.string().datetime({ offset: true }),
})

export async function fetchMarketStatus(): Promise<MarketStatus> {
  const data = await api.get('market/status').json()
  return marketStatusSchema.parse(data)
}
