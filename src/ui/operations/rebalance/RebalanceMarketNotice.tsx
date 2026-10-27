import { AlertCircle, Clock } from 'lucide-react'
import type { MarketStatus } from '../../../domain/market/session'
import { marketText } from '../../glossary/market'
import { formatNextOpenTime } from '../../../app/market/format-time'
import { StatusBadge } from './RebalanceFillChip'

type Props = {
  status?: MarketStatus
  isError?: boolean
}

export function RebalanceMarketNotice({ status, isError }: Props) {
  if (isError) {
    return (
      <div id="market-status-notice" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
        <StatusBadge label={marketText.checkFailed} tone="bg-amber-50 text-amber-800">
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>{marketText.noticeShort.error}</span>
        </StatusBadge>
      </div>
    )
  }

  if (!status || status.open) return null

  const reasonLabel = marketText.reasons[status.reason] ?? marketText.reasons['closed-hours']
  const time = status.nextOpenAt ? formatNextOpenTime(status.nextOpenAt) : undefined

  return (
    <div id="market-status-notice" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
      <StatusBadge label={marketText.notice(reasonLabel, time)} tone="bg-amber-50 text-amber-800">
        <Clock aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{marketText.noticeShort.closed}</span>
      </StatusBadge>
    </div>
  )
}
