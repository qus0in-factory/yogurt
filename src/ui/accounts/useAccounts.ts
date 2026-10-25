import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAccount, deleteAccount, listAccounts, reorderAccounts, setAccountProduct, updateAccount } from '../../app/accounts/client'
import type { Account, AccountUpdate } from '../../domain/accounts/account'
import { toast } from 'sonner'
import { accountsText } from '../glossary/accounts'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: listAccounts })
}

export function useReorderAccounts() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => reorderAccounts(ids),
    onMutate: async (ids) => {
      await client.cancelQueries({ queryKey: ['accounts'] })
      const previous = client.getQueryData<Account[]>(['accounts'])
      client.setQueryData<Account[]>(['accounts'], (accounts) => ids.flatMap((id) => {
        const account = accounts?.find((entry) => entry.id === id)
        return account ? [account] : []
      }))
      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(['accounts'], context.previous)
      toast.error(accountsText.reorderFailed)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
  })
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

export function useSetAccountProduct() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, code, enabled }: { id: string; code: string; enabled: boolean }) => setAccountProduct(id, code, enabled),
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
