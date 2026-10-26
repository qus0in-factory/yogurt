import type { Account } from '../../../domain/accounts/account'
import { ACCOUNT_PRODUCTS } from '../../../domain/accounts/products'
import type { PortfolioAssignment } from '../../../domain/portfolio/assignment'
import { CASH_ITEM_NAME } from '../../../domain/portfolio/item'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { formatBps } from '../../../domain/portfolio/weight'
import { portfolioListText } from '../../glossary/portfolio-list'

export type ActiveProductTarget = {
  key: string
  accountId: string
  productCode: '01' | '22' | '29'
  label: string
  assignedPortfolioId: string | null
}

export function buildActiveProductTargets(
  accounts: Account[],
  assignments: PortfolioAssignment[],
): ActiveProductTarget[] {
  const assignmentMap = new Map<string, string>()
  for (const item of assignments) {
    assignmentMap.set(`${item.accountId}:${item.productCode}`, item.portfolioId)
  }
  const targets: ActiveProductTarget[] = []
  for (const account of accounts) {
    for (const product of ACCOUNT_PRODUCTS) {
      if (!account.products.includes(product.code)) continue
      const key = `${account.id}:${product.code}`
      targets.push({
        key,
        accountId: account.id,
        productCode: product.code,
        label: `${account.owner} · ${account.alias} · ${product.label}`,
        assignedPortfolioId: assignmentMap.get(key) ?? null,
      })
    }
  }
  return targets
}

export function summarizePortfolioWeights(portfolio: Portfolio, topLimit = 3) {
  const securities = portfolio.items
    .filter((item) => item.kind === 'security')
    .sort((a, b) => b.targetWeightBps - a.targetWeightBps)
  const cashItem = portfolio.items.find((item) => item.kind === 'cash' || item.stockName === CASH_ITEM_NAME)
  const topSecurities = securities.slice(0, topLimit).map(
    (item) => `${item.stockName} ${formatBps(item.targetWeightBps)}`,
  )
  const extraCount = Math.max(0, securities.length - topLimit)
  const cashSummary = cashItem ? portfolioListText.cashIncluded(formatBps(cashItem.targetWeightBps)) : null
  return { topSecurities, extraCount, cashSummary }
}
