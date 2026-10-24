import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { checkSession, login, logout } from '../../app/auth/client'
import { clearClientStorage } from '../state/clear-client-storage'

const SESSION_KEY = ['session']

export function useSession() {
  const session = useQuery({ queryKey: SESSION_KEY, queryFn: checkSession })
  useEffect(() => {
    if (session.data === false) void clearClientStorage(false)
  }, [session.data])
  return session
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
    onSuccess: async () => {
      await clearClientStorage()
      client.setQueryData(SESSION_KEY, false)
    },
  })
}
