import { ArrowRightLeft, Link2, Unlink2 } from 'lucide-react'
import { portfolioListText } from '../../glossary/portfolio-list'

type Props = { checked: boolean; assignedId: string | null; otherName?: string }

export function PortfolioAssignmentStatus({ checked, assignedId, otherName }: Props) {
  const other = !!assignedId && !checked
  const label = checked ? portfolioListText.connectedStatus : other
    ? portfolioListText.otherStatus(otherName ?? assignedId!) : portfolioListText.unconnectedStatus
  const Icon = checked ? Link2 : other ? ArrowRightLeft : Unlink2
  const tone = checked ? 'text-primary-700' : other ? 'text-amber-700' : 'text-stone-400'
  return (
    <span role="img" aria-label={label} title={label} className={`inline-flex align-middle ${tone}`}>
      <Icon aria-hidden="true" className="h-4 w-4" />
    </span>
  )
}
