import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useClearPortfolioAssignment, useSetPortfolioAssignment } from '../../../app/portfolio/queries'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { Button } from '../../components/Button'
import { SectionHeading } from '../../components/SectionHeading'
import { portfolioListText } from '../../glossary/portfolio-list'
import { cn } from '../../lib/cn'
import { typeScale } from '../../styles/type-scale'
import type { ActiveProductTarget } from './portfolio-list-model'

type Props = {
  portfolios: Portfolio[]
  targets: ActiveProductTarget[]
  isLoading: boolean
  isError: boolean
  onRefresh: () => void
}

export function PortfolioAssignmentSection({ portfolios, targets, isLoading, isError, onRefresh }: Props) {
  const setAssignment = useSetPortfolioAssignment()
  const clearAssignment = useClearPortfolioAssignment()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const handleChange = (target: ActiveProductTarget, nextPortfolioId: string) => {
    setErrorMessage(null)
    setPendingKey(target.key)
    const callbacks = {
      onSuccess: () => setPendingKey(null),
      onError: () => { setPendingKey(null); setErrorMessage(portfolioListText.assignmentFailed) },
    }
    if (!nextPortfolioId) {
      clearAssignment.mutate({ accountId: target.accountId, productCode: target.productCode }, callbacks)
      return
    }
    setAssignment.mutate({ accountId: target.accountId, productCode: target.productCode, portfolioId: nextPortfolioId }, callbacks)
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <SectionHeading level={3}>{portfolioListText.assignmentHeading}</SectionHeading>
          <p className={typeScale.caption}>{portfolioListText.assignmentDescription}</p>
        </div>
        <Button variant="outline" size="sm" className="min-h-11" onClick={onRefresh}>
          <RefreshCw aria-hidden="true" className="h-4 w-4" />{portfolioListText.refreshAssignments}
        </Button>
      </div>
      {errorMessage ? <p role="alert" className={cn(typeScale.body, 'text-rose-600')}>{errorMessage}</p> : null}
      {isLoading ? <p className={typeScale.body}>{portfolioListText.assignmentLoading}</p> : isError ? (
        <p role="alert" className={cn(typeScale.body, 'text-rose-600')}>{portfolioListText.assignmentLoadError}</p>
      ) : targets.length === 0 ? <p className={typeScale.caption}>{portfolioListText.assignmentEmpty}</p> : (
        <ul className="divide-y divide-stone-100">
          {targets.map((target) => (
            <li key={target.key} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className={cn(typeScale.body, 'min-w-0 break-words font-medium')}>{target.label}</span>
              <select
                aria-label={portfolioListText.selectLabel(target.label)}
                value={target.assignedPortfolioId ?? ''}
                disabled={pendingKey === target.key}
                onChange={(e) => handleChange(target, e.target.value)}
                className={cn(typeScale.body, 'min-h-11 rounded-md border border-stone-300 bg-white px-3')}
              >
                <option value="">{portfolioListText.unassigned}</option>
                {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
