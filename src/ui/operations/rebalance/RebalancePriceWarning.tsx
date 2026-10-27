import { TriangleAlert } from 'lucide-react'
import type { RebalanceInputs } from '../../../app/rebalance/types'
import { rebalanceText } from '../../glossary/rebalance'
import { StatusBadge } from './RebalanceFillChip'

type Props = { inputs?: Pick<RebalanceInputs, 'priceFailed' | 'targets' | 'holdings'> }

export function RebalancePriceWarning({ inputs }: Props) {
  const failed = inputs?.priceFailed ?? []
  if (!failed.length) return null
  const labels = [...new Set(failed)].map(code => {
    const name = inputs?.targets.find(item => item.code === code)?.name
      || inputs?.holdings.find(item => item.code === code)?.name
    return name && name !== code ? rebalanceText.failedPriceStock(name, code) : code
  })
  return (
    <StatusBadge label={rebalanceText.priceFailed(labels.join(', '))} tone="bg-amber-50 text-amber-800">
      <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{rebalanceText.noticeShort.price}</span>
    </StatusBadge>
  )
}
