import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PortfolioDraft } from '../../domain/portfolio/portfolio'
import { clearPortfolioAssignment, listPortfolioAssignments, setPortfolioAssignment } from './assignments-client'
import { createPortfolio, deletePortfolio, listPortfolios, updatePortfolio } from './client'

export const PORTFOLIOS_QUERY_KEY = ['portfolios'] as const
export const PORTFOLIO_ASSIGNMENTS_QUERY_KEY = ['portfolio-assignments'] as const

export function usePortfolios() {
  return useQuery({ queryKey: PORTFOLIOS_QUERY_KEY, queryFn: listPortfolios })
}

export function usePortfolioAssignments() {
  return useQuery({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY, queryFn: listPortfolioAssignments })
}

export function useCreatePortfolio() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: PortfolioDraft) => createPortfolio(input),
    onSuccess: () => client.invalidateQueries({ queryKey: PORTFOLIOS_QUERY_KEY }),
  })
}

export function useUpdatePortfolio() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PortfolioDraft }) => updatePortfolio(id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: PORTFOLIOS_QUERY_KEY }),
  })
}

export function useDeletePortfolio() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePortfolio(id),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: PORTFOLIOS_QUERY_KEY }),
        client.invalidateQueries({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY }),
      ])
    },
  })
}

export function useSetPortfolioAssignment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, productCode, portfolioId }: { accountId: string; productCode: string; portfolioId: string }) =>
      setPortfolioAssignment(accountId, productCode, portfolioId),
    onSuccess: () => client.invalidateQueries({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY }),
  })
}

export function useClearPortfolioAssignment() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, productCode }: { accountId: string; productCode: string }) =>
      clearPortfolioAssignment(accountId, productCode),
    onSuccess: () => client.invalidateQueries({ queryKey: PORTFOLIO_ASSIGNMENTS_QUERY_KEY }),
  })
}
