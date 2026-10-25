import { useQuery } from '@tanstack/react-query'
import { getAccountAssets } from '../../app/kis/account-assets-client'

export function useIsaProgress(accountId: string) {
  const query = useQuery({
    queryKey: ['account-assets', accountId, '01'],
    queryFn: () => getAccountAssets(accountId, '01'),
    retry: false,
    enabled: Boolean(accountId),
  })

  const totalAssets = query.data?.summary?.totalAssets ?? null

  return {
    isPending: query.isPending,
    isError: query.isError,
    totalAssets,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  }
}
