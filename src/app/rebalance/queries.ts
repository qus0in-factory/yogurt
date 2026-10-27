import { useQuery } from '@tanstack/react-query'
import { fetchRebalanceInputs } from './client'
export const REBALANCE_INPUTS_QUERY_KEY = ['rebalance-inputs'] as const
export function useRebalanceInputs(accountId: string, productCode: string) {
  return useQuery({
    queryKey: [...REBALANCE_INPUTS_QUERY_KEY, accountId, productCode],
    queryFn: ({ signal }) => fetchRebalanceInputs(accountId, productCode, signal),
    enabled: !!accountId && !!productCode,
    staleTime: 60_000,
  })
}
