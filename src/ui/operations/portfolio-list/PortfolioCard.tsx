import { Pencil, Trash2 } from 'lucide-react'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { Button } from '../../components/Button'
import { portfolioListText } from '../../glossary/portfolio-list'
import { cn } from '../../lib/cn'
import { typeScale } from '../../styles/type-scale'
import { summarizePortfolioWeights } from './portfolio-list-model'

type PortfolioCardProps = {
  portfolio: Portfolio
  assignedCount: number
  onEdit?: (portfolio: Portfolio) => void
  onDelete: (portfolio: Portfolio) => void
}

export function PortfolioCard({ portfolio, assignedCount, onEdit, onDelete }: PortfolioCardProps) {
  const { topSecurities, extraCount, cashSummary } = summarizePortfolioWeights(portfolio)

  return (
    <article className="flex min-w-0 flex-col justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(typeScale.title, 'min-w-0 break-words')}>{portfolio.name}</h4>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn(typeScale.label, 'rounded bg-stone-100 px-2 py-0.5 tabular-nums')}>
              {portfolioListText.itemCount(portfolio.items.length)}
            </span>
            <span className={cn(typeScale.label, 'rounded bg-primary-100 px-2 py-0.5 tabular-nums')}>
              {portfolioListText.assignedCount(assignedCount)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topSecurities.map((label) => (
            <span key={label} className={cn(typeScale.body, 'min-w-0 break-words rounded bg-stone-50 px-2 py-0.5 tabular-nums')}>
              {label}
            </span>
          ))}
          {extraCount > 0 ? (
            <span className={cn(typeScale.caption, 'px-1.5 py-0.5 tabular-nums')}>
              {portfolioListText.moreItems(extraCount)}
            </span>
          ) : null}
          {cashSummary ? (
            <span className={cn(typeScale.body, 'rounded bg-stone-100 px-2 py-0.5 tabular-nums')}>
              {cashSummary}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 px-3"
          aria-label={`${portfolio.name} ${portfolioListText.editButton}`}
          onClick={() => onEdit?.(portfolio)}
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
          {portfolioListText.editButton}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 px-3 text-rose-700 hover:bg-rose-50"
          aria-label={`${portfolio.name} ${portfolioListText.deleteButton}`}
          onClick={() => onDelete(portfolio)}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {portfolioListText.deleteButton}
        </Button>
      </div>
    </article>
  )
}
