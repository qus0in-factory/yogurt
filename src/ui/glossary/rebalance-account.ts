import type { TargetAccountOption } from '../../app/rebalance/types'

export function formatRebalanceAccountOption(option: TargetAccountOption, product: string, masked: boolean) {
  const owner = option.owner?.trim()
  const ownerText = owner ? ` · ${masked ? '●●●' : owner}` : ''
  const accountNumber = masked ? '●●●●●●●●' : option.accountNumber
  return `${option.alias}${ownerText} · ${product} (${accountNumber}) [${option.portfolioName}]`
}
