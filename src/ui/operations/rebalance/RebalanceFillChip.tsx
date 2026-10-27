import { AlertCircle, Ban, CheckCircle2, CircleDot, Clock, HelpCircle, PieChart, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FillUpdate } from '../../../app/trading/fill-stream'
import { InfoTooltip } from '../../components/InfoTooltip'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

export type FillChipStatus = FillUpdate['status'] | 'closed_partial' | 'not_found' | 'noOrderId'

const ICONS = {
  filled: CheckCircle2, closed_partial: PieChart, partial: CircleDot, open: Clock,
  cancelled: Ban, unknown: HelpCircle, noOrderId: AlertCircle, not_found: Search,
} as const

const STYLES: Record<FillChipStatus, string> = {
  filled: 'bg-emerald-50 text-emerald-700', closed_partial: 'bg-purple-50 text-purple-700', partial: 'bg-blue-50 text-blue-700',
  open: 'bg-stone-100 text-stone-700', cancelled: 'bg-rose-50 text-rose-700',
  unknown: 'bg-amber-50 text-amber-700', noOrderId: 'bg-amber-50 text-amber-700',
  not_found: 'bg-blue-50 text-blue-700',
}

export function StatusBadge({ label, tone, children }: { label: string; tone: string; children: ReactNode }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${typeScale.label} ${tone}`}>
      {children}
      <InfoTooltip label={label}>{label}</InfoTooltip>
    </span>
  )
}

export function RebalanceFillChip({ status }: { status: FillChipStatus }) {
  const Icon = ICONS[status] ?? HelpCircle
  const label = rebalanceText.fillStatus[status] ?? status
  const style = STYLES[status] ?? STYLES.unknown

  return (
    <StatusBadge label={label} tone={style}>
      <Icon aria-hidden="true" className="h-3 w-3" />
    </StatusBadge>
  )
}
