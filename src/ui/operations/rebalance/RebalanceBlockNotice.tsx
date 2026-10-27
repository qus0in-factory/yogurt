import { TriangleAlert } from 'lucide-react'
import { rebalanceText } from '../../glossary/rebalance'
import { StatusBadge } from './RebalanceFillChip'
import type { BlockReason } from './useRebalancePlanSnapshot'

type Props = { reason: Exclude<BlockReason, null> }

export function RebalanceBlockNotice({ reason }: Props) {
  const message = reason === 'keep' ? rebalanceText.keepLoadBlocked
    : reason === 'keep-save' ? rebalanceText.keepSaveBlocked
    : reason === 'cash' ? rebalanceText.cashBlocked
    : reason === 'price' ? rebalanceText.priceBlocked : rebalanceText.keepNotBelowTotal
  return (
    <StatusBadge label={message} tone="bg-amber-50 text-amber-800">
      <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{rebalanceText.blockedShort[reason]}</span>
    </StatusBadge>
  )
}
