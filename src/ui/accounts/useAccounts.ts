import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAccount, listAccounts } from '../../app/accounts/client'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: listAccounts })
}

export function useCreateAccount() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
