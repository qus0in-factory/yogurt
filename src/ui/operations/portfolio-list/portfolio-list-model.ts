import type { Account } from '../../../domain/accounts/account'
import { ACCOUNT_PRODUCTS } from '../../../domain/accounts/products'
import type { PortfolioAssignment } from '../../../domain/portfolio/assignment'
import { CASH_ITEM_NAME } from '../../../domain/portfolio/item'
import type { Portfolio, PortfolioDraft } from '../../../domain/portfolio/portfolio'
import { formatBps, MAX_WEIGHT_BPS } from '../../../domain/portfolio/weight'
import { portfolioListText } from '../../glossary/portfolio-list'

export type ActiveProductTarget = {
  key: string
  accountId: string
  productCode: '01' | '22'
  accountNumber: string
  alias: string
  accountLabel: string
  label: string
  assignedPortfolioId: string | null
}

export const PIE_MAX_INDIVIDUAL_SLICES = 7

const SLICE_TONES = [
  { stroke: 'stroke-primary-600', dot: 'bg-primary-600' },
  { stroke: 'stroke-primary-500', dot: 'bg-primary-500' },
  { stroke: 'stroke-primary-400', dot: 'bg-primary-400' },
  { stroke: 'stroke-primary-300', dot: 'bg-primary-300' },
  { stroke: 'stroke-amber-500', dot: 'bg-amber-500' },
  { stroke: 'stroke-teal-500', dot: 'bg-teal-500' },
  { stroke: 'stroke-indigo-400', dot: 'bg-indigo-400' },
  { stroke: 'stroke-stone-400', dot: 'bg-stone-400' },
] as const

export function buildActiveProductTargets(accounts: Account[], assignments: PortfolioAssignment[]): ActiveProductTarget[] {
  const assignmentMap = new Map(assignments.map((item) => [`${item.accountId}:${item.productCode}`, item.portfolioId]))
  return accounts.flatMap((account) =>
    ACCOUNT_PRODUCTS.filter((p) => p.code !== '29').filter((p) => account.products.includes(p.code)).map((product) => {
      const key = `${account.id}:${product.code}`
      return {
        key, accountId: account.id, productCode: product.code,
        accountNumber: account.accountNumber, alias: account.alias,
        accountLabel: portfolioListText.accountLabel(account.accountNumber, account.alias),
        label: portfolioListText.targetLabel(account.accountNumber, account.alias, portfolioListText.productNames[product.code]),
        assignedPortfolioId: assignmentMap.get(key) ?? null,
      }
    }),
  )
}

export function buildDuplicatePortfolioDraft(portfolio: Portfolio): PortfolioDraft {
  const suffix = portfolioListText.duplicateSuffix
  const baseName = portfolio.name.trim().slice(0, 40 - suffix.length)
  return {
    name: `${baseName}${suffix}`,
    items: portfolio.items.map((item) => ({ ...item })),
  }
}

export function buildPortfolioPieModel(portfolio: Portfolio, maxSlices = PIE_MAX_INDIVIDUAL_SLICES) {
  const totalBps = portfolio.items.reduce((sum, item) => sum + item.targetWeightBps, 0)
  if (totalBps !== MAX_WEIGHT_BPS) return { valid: false as const, slices: [], summaryText: '' }
  const sorted = [...portfolio.items].sort((a, b) => b.targetWeightBps - a.targetWeightBps)
  const head = sorted.slice(0, maxSlices).map((it, idx) => ({
    key: it.kind === 'cash' ? 'cash' : `${it.stockCode ?? idx}`,
    label: it.kind === 'cash' ? CASH_ITEM_NAME : it.stockName,
    weightBps: it.targetWeightBps,
  }))
  const tailBps = sorted.slice(maxSlices).reduce((sum, it) => sum + it.targetWeightBps, 0)
  const rawSlices = tailBps > 0 ? [...head, { key: 'other', label: portfolioListText.otherSliceLabel, weightBps: tailBps }] : head
  const slices = rawSlices.map((s, idx) => {
    const tone = SLICE_TONES[idx % SLICE_TONES.length]
    return { ...s, weightText: formatBps(s.weightBps), strokeClass: tone.stroke, dotClass: tone.dot }
  })
  const summaryText = slices.map((s) => `${s.label} ${s.weightText}`).join(', ')
  return { valid: true as const, slices, summaryText }
}
