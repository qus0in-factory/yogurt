import { useRebalanceInputs as useInputsQuery } from './queries'
import { usePortfolioAssignments, usePortfolios } from '../portfolio/queries'
import { useAccounts } from '../../ui/accounts/useAccounts'
import type { RebalanceTarget } from '../../domain/rebalance/types'
import type { RebalanceInputs, TargetAccountOption } from './types'

export function useTargetAccounts(): TargetAccountOption[] {
  const { data: accounts } = useAccounts()
  const { data: assignments } = usePortfolioAssignments()
  const { data: portfolios } = usePortfolios()
  if (!accounts || !assignments || !portfolios) return []

  const portfolioMap = new Map(portfolios.map((p) => [p.id, p.name]))
  return assignments.flatMap((as) => {
    const account = accounts.find((a) => a.id === as.accountId)
    if (!account || (as.productCode !== '01' && as.productCode !== '22')) return []
    return [{
      accountId: account.id,
      productCode: as.productCode,
      accountNumber: account.accountNumber,
      alias: account.alias,
      owner: account.owner,
      portfolioId: as.portfolioId,
      portfolioName: portfolioMap.get(as.portfolioId) ?? '',
    }]
  })
}

export function useRebalanceInputs(target: TargetAccountOption | null) {
  const query = useInputsQuery(target?.accountId ?? '', target?.productCode ?? '')
  const input = query.data
  const data: RebalanceInputs | undefined = input ? {
    holdings: input.holdings.map(({ code, name, quantity, currentPrice }) => ({
      code, name, quantity, evaluationAmount: quantity * (input.prices[code] ?? currentPrice),
    })),
    cash: input.cash,
    targets: input.targets.map((item): RebalanceTarget => item.kind === 'security'
      ? { kind: 'stock', code: item.code!, name: item.name, weightBps: item.weightBps }
      : { kind: 'cash', code: null, name: item.name, weightBps: item.weightBps }),
    prices: input.prices,
    priceFailed: input.priceFailed,
    hasPortfolio: input.hasPortfolio,
  } : undefined
  return { ...query, data }
}
