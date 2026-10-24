import { useMutation } from '@tanstack/react-query'
import { requestKisToken } from '../../app/accounts/client'

export function useKisToken() {
  return useMutation({ mutationFn: (id: string) => requestKisToken(id) })
}
