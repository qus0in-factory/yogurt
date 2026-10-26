import { usePortfolioAssignments, usePortfolios } from '../../../app/portfolio/queries'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { useAccounts } from '../../accounts/useAccounts'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { typeScale } from '../../styles/type-scale'
import { portfolioListText } from '../../glossary/portfolio-list'
import { PortfolioAssignmentSection } from './PortfolioAssignmentSection'
import { buildActiveProductTargets } from './portfolio-list-model'

type Props = { portfolio: Portfolio; onClose: () => void }

export function PortfolioAssignmentDialog({ portfolio, onClose }: Props) {
  const accounts = useAccounts()
  const assignments = usePortfolioAssignments()
  const portfolios = usePortfolios()
  return (
    <Dialog open className="min-w-0 md:max-w-2xl" onClose={onClose} title={
      <>
        <strong className={`${typeScale.section} block min-w-0 break-words [overflow-wrap:anywhere]`}>{portfolio.name}</strong>
        <span className={`${typeScale.caption} mt-1 block font-normal`}>{portfolioListText.assignmentHeading}</span>
      </>
    }>
      <PortfolioAssignmentSection
        portfolio={portfolio}
        accounts={accounts.data ?? []}
        portfolios={portfolios.data ?? []}
        targets={buildActiveProductTargets(accounts.data ?? [], assignments.data ?? [])}
        isLoading={accounts.isPending || assignments.isPending || portfolios.isPending}
        isError={accounts.isError || assignments.isError || portfolios.isError}
        onRefresh={() => { void accounts.refetch(); void assignments.refetch(); void portfolios.refetch() }}
      />
      <Button variant="outline" className="mt-4 min-h-11" onClick={onClose}>{portfolioListText.closeButton}</Button>
    </Dialog>
  )
}
