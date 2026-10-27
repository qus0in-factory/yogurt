import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { REBALANCE_INPUTS_QUERY_KEY } from '../../../app/rebalance/queries'

type Target = { accountId: string; productCode: string } | null

// 주문 성공·게이트 재조회에만 쓴다. 주기 폴링과 포커스 자동 조회는 없다.
export function invalidateRebalanceInputs(queryClient: QueryClient, accountId: string, productCode: string): void {
  const tuple = [accountId, productCode]
  ;[REBALANCE_INPUTS_QUERY_KEY, ['product-balance'], ['account-assets']].forEach((key) => {
    void queryClient.invalidateQueries({ queryKey: [...key, ...tuple] })
  })
}

export function useRebalanceAutoRefresh(currentTarget: Target): { refresh: () => void } {
  const queryClient = useQueryClient()
  return {
    refresh: () => {
      if (currentTarget) invalidateRebalanceInputs(queryClient, currentTarget.accountId, currentTarget.productCode)
    },
  }
}
