import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { setProductPlan } from '../../app/accounts/client'
import type { Account } from '../../domain/accounts/account'
import type { ProductPlanRequest } from '../../domain/accounts/product-plan'
import { isaText } from '../glossary/isa'

export function useProductPlan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, code, plan }: { id: string; code: string; plan: ProductPlanRequest }) => setProductPlan(id, code, plan),
    onMutate: async ({ id, code, plan }) => {
      await client.cancelQueries({ queryKey: ['accounts'] })
      const previous = client.getQueryData<Account[]>(['accounts'])
      client.setQueryData<Account[]>(['accounts'], (accounts) => accounts?.map((account) => {
        if (account.id !== id) return account
        const productPlans = { ...account.productPlans }
        if (plan.startDate === null) delete productPlans[code]
        else productPlans[code] = {
          startDate: plan.startDate,
          minTargetAmountWon: plan.minTargetAmountWon,
          maxTargetAmountWon: plan.maxTargetAmountWon,
        }
        return { ...account, productPlans }
      }))
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(['accounts'], context.previous)
      toast.error(isaText.saveFailed)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
