import { useMutation, useQueryClient } from '@tanstack/react-query'
import { replaceCredentials, type CredentialsInput } from '../../app/accounts/credentials-client'

export function useReplaceCredentials(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CredentialsInput) => replaceCredentials(accountId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kis-status'] }),
  })
}
