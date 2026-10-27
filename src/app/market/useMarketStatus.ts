import { useQuery } from '@tanstack/react-query'
import { fetchMarketStatus } from './market-client'
import type { MarketStatus } from '../../domain/market/session'

export const MARKET_STATUS_QUERY_KEY = ['market', 'status'] as const

export function useMarketStatus() {
  return useQuery<MarketStatus>({
    queryKey: MARKET_STATUS_QUERY_KEY,
    queryFn: fetchMarketStatus,
    refetchInterval: 60_000,
  })
}
