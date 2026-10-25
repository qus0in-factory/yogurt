import { useQuery } from '@tanstack/react-query'
import { getIsaLastClose } from '../../app/accounts/client'

export function useIsaLastClose(accountId: string, enabled = true) {
  const query = useQuery({
    queryKey: ['isa-last-close', accountId],
    queryFn: () => getIsaLastClose(accountId),
    retry: false,
    enabled: Boolean(accountId) && enabled,
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    data: query.data ?? null,
    refetch: query.refetch,
  }
}
