import { PieChart, Plus } from 'lucide-react'
import { useState } from 'react'
import { usePortfolioAssignments, usePortfolios } from '../../../app/portfolio/queries'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { useAccounts } from '../../accounts/useAccounts'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { SectionHeading } from '../../components/SectionHeading'
import { portfolioListText } from '../../glossary/portfolio-list'
import { cn } from '../../lib/cn'
import { useAdaptiveWidth } from '../../lib/useAdaptiveWidth'
import { typeScale } from '../../styles/type-scale'
import { PortfolioEditorDialog } from '../portfolio/PortfolioEditorDialog'
import { DeletePortfolioDialog } from './DeletePortfolioDialog'
import { PortfolioCardList } from './PortfolioCardList'
import { buildActiveProductTargets } from './portfolio-list-model'
import { usePortfolioEditorController } from './usePortfolioEditorController'

export type PortfolioSectionProps = {
  onCreate?: () => void
  onEdit?: (portfolio: Portfolio) => void
}

export function PortfolioSection({ onCreate, onEdit }: PortfolioSectionProps) {
  const width = useAdaptiveWidth()
  const [deleting, setDeleting] = useState<Portfolio | null>(null)
  const portfoliosQuery = usePortfolios()
  const assignmentsQuery = usePortfolioAssignments()
  const accountsQuery = useAccounts()
  const portfolios = portfoliosQuery.data ?? []
  const assignments = assignmentsQuery.data ?? []
  const targets = buildActiveProductTargets(accountsQuery.data ?? [], assignments)
  const editor = usePortfolioEditorController(assignments, onCreate, onEdit)

  return (
    <div className={cn('flex min-w-0 flex-col gap-6 overflow-x-hidden', width === 'small' ? 'p-3' : 'p-4')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <SectionHeading level={3}>{portfolioListText.heading}</SectionHeading>
          <p className={typeScale.caption}>{portfolioListText.description}</p>
        </div>
        <Button className="min-h-11" onClick={editor.openCreate}>
          <Plus aria-hidden="true" className="h-4 w-4" />{portfolioListText.createButton}
        </Button>
      </div>
      {portfoliosQuery.isPending ? <p className={typeScale.body}>{portfolioListText.loading}</p> : portfoliosQuery.isError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className={cn(typeScale.body, 'text-rose-600')}>{portfolioListText.loadError}</p>
          <Button variant="outline" size="sm" className="min-h-11" onClick={() => void portfoliosQuery.refetch()}>{portfolioListText.retry}</Button>
        </div>
      ) : portfolios.length === 0 ? (
        <EmptyState icon={PieChart} title={portfolioListText.emptyTitle} description={portfolioListText.emptyDescription} action={<Button className="min-h-11" onClick={editor.openCreate}>{portfolioListText.createButton}</Button>} />
      ) : (
        <PortfolioCardList
          width={width}
          portfolios={portfolios}
          assignments={assignments}
          onDuplicate={editor.openDuplicate}
          onEdit={editor.openEdit}
          onDelete={setDeleting}
        />
      )}
      {editor.open ? (
        <PortfolioEditorDialog key={editor.editorKey} open onClose={editor.closeEditor} onSubmit={editor.submitEditor} initialValue={editor.initialValue} assignedCount={editor.assignedCount} serverError={editor.serverError} />
      ) : null}
      {deleting ? (
        <DeletePortfolioDialog portfolio={deleting} assignedTargets={targets.filter((t) => t.assignedPortfolioId === deleting.id)} onClose={() => setDeleting(null)} />
      ) : null}
    </div>
  )
}
