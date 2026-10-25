import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getRiskClasses, setRiskClass, type RiskClass } from '../../app/kis/risk-class-client'
import { overviewText as text } from '../glossary/overview'

export type RiskToggleInput = { stockCode: string; riskClass: RiskClass }

export function useRiskClasses(accountId: string, productCode = '29') {
  const queryClient = useQueryClient()
  const queryKey = ['risk-classes', accountId, productCode]
  const query = useQuery({
    queryKey,
    queryFn: () => getRiskClasses(accountId, productCode),
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: (input: RiskToggleInput) => setRiskClass(accountId, productCode, input.stockCode, input.riskClass),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error(text.riskClassFailed),
  })
  return {
    classes: query.data ?? {},
    toggle: mutation.mutate,
    isPending: query.isPending,
    isError: query.isError,
    isSaving: mutation.isPending,
    refetch: query.refetch,
  }
}
