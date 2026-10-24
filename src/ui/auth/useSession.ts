import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkSession, login, logout } from '../../app/auth/client'

const SESSION_KEY = ['session']

export function useSession() {
  return useQuery({ queryKey: SESSION_KEY, queryFn: checkSession })
}

export function useLogin() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (ok) => {
      if (ok) client.setQueryData(SESSION_KEY, true)
    },
  })
}

export function useLogout() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => client.setQueryData(SESSION_KEY, false),
  })
}
