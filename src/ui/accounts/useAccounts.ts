import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAccount, deleteAccount, listAccounts, updateAccount } from '../../app/accounts/client'
import type { AccountUpdate } from '../../domain/accounts/account'

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

export function useUpdateAccount() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountUpdate }) => updateAccount(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error) => {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) void client.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
