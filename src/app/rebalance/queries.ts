import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRebalanceInputs } from './client'
import { fetchOpenOrders } from '../trading/open-orders-client'
import { fetchKeepAmount, saveKeepAmount } from './keep-amount-client'
export const REBALANCE_INPUTS_QUERY_KEY = ['rebalance-inputs'] as const
export const OPEN_ORDERS_QUERY_KEY = ['open-orders'] as const
export const KEEP_AMOUNT_QUERY_KEY = ['rebalance-keep-amount'] as const
export function useRebalanceInputs(accountId: string, productCode: string) {
  return useQuery({
    queryKey: [...REBALANCE_INPUTS_QUERY_KEY, accountId, productCode],
    queryFn: ({ signal }) => fetchRebalanceInputs(accountId, productCode, signal),
    enabled: !!accountId && !!productCode,
    staleTime: 60_000,
  })
}
export function useOpenOrders(accountId: string, productCode: string) {
  return useQuery({
    queryKey: [...OPEN_ORDERS_QUERY_KEY, accountId, productCode],
    queryFn: () => fetchOpenOrders(accountId, productCode),
    enabled: !!accountId && !!productCode,
    staleTime: 60_000,
  })
}
export function useKeepAmount(accountId: string, productCode: string) {
  return useQuery({
    queryKey: [...KEEP_AMOUNT_QUERY_KEY, accountId, productCode],
    queryFn: ({ signal }) => fetchKeepAmount(accountId, productCode, signal),
    enabled: !!accountId && !!productCode,
    staleTime: 60_000,
  })
}
export function useSaveKeepAmount(accountId: string, productCode: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (keepAmount: number) => saveKeepAmount(accountId, productCode, keepAmount),
    onSuccess: (data) => client.setQueryData([...KEEP_AMOUNT_QUERY_KEY, accountId, productCode], data),
  })
}
