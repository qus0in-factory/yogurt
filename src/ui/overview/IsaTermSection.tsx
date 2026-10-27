import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { isaTerm, isaYear, seoulToday, type IsaTermStatus } from '../../app/accounts/isa-term'
import { useAccounts } from '../accounts/useAccounts'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { SectionHeading } from '../components/SectionHeading'
import { Sensitive } from '../components/Sensitive'
import { StatGrid } from '../components/StatGrid'
import { isaText } from '../glossary/isa'
import { spacing, typeScale } from '../styles/type-scale'
import { IsaPlanAmountSummary } from './IsaPlanAmountSummary'
import { IsaProgressSection } from './IsaProgressSection'
import { IsaTermDialog } from './IsaTermDialog'
import { useIsaProgress } from './useIsaProgress'

const chipTone: Record<IsaTermStatus, string> = {
  active: 'bg-primary-100 text-primary-700',
  expiringSoon: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
}

export function IsaTermSection({ accountId }: { accountId: string }) {
  const { data } = useAccounts()
  const { totalAssets } = useIsaProgress(accountId)
  const [open, setOpen] = useState(false)
  const plan = data?.find((account) => account.id === accountId)?.productPlans?.['01']
  const today = seoulToday()
  const term = plan ? isaTerm(plan.startDate, today) : null
  const year = plan ? isaYear(plan.startDate, today) : null
  const yearText = year === 'beforeStart' ? isaText.beforeStart : typeof year === 'number' ? isaText.year(year) : null

  return (
    <section aria-label={isaText.term} className={spacing.stack}>
      <div className="flex items-center justify-between gap-2">
        <SectionHeading>{isaText.term}</SectionHeading>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <CalendarDays aria-hidden="true" className="h-4 w-4" />
          {isaText.edit}
        </Button>
      </div>
      {plan && term ? (
        <>
          <div data-testid="isa-term-grid">
            <StatGrid
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
              items={[
                { label: <span className={typeScale.label}>{isaText.startDate}</span>, value: <Sensitive className={typeScale.number}>{isaText.date(plan.startDate)}</Sensitive> },
                { label: <span className={typeScale.label}>{isaText.maturity}</span>, value: <Sensitive className={typeScale.number}>{isaText.date(term.expiry)}</Sensitive> },
                {
                  label: <span className={typeScale.label}>{isaText.remaining}</span>,
                  value: (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span data-testid="isa-dday" data-status={term.status} className={`inline-flex rounded-full px-2 py-1 font-semibold ${typeScale.caption} ${chipTone[term.status]}`}>
                        {term.status === 'expired' ? isaText.expired : isaText.daysLeft(term.daysLeft)}
                      </span>
                      {yearText ? <span data-testid="isa-year" className={typeScale.caption}>{yearText}</span> : null}
                    </div>
                  ),
                },
              ]}
            />
          </div>
          <IsaPlanAmountSummary plan={plan} totalAssets={totalAssets} />
          <IsaProgressSection accountId={accountId} plan={plan} />
        </>
      ) : (
        <EmptyState icon={CalendarDays} title={isaText.emptyTitle} description={isaText.empty} action={<Button size="sm" onClick={() => setOpen(true)}>{isaText.emptyAction}</Button>} />
      )}
      {open ? <IsaTermDialog accountId={accountId} plan={plan} open onClose={() => setOpen(false)} /> : null}
    </section>
  )
}
