import type { Account } from '../../../domain/accounts/account'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { Button } from '../../components/Button'
import { portfolioListText } from '../../glossary/portfolio-list'
import { typeScale } from '../../styles/type-scale'
import { PortfolioAssignmentRow } from './PortfolioAssignmentRow'
import type { ActiveProductTarget } from './portfolio-list-model'

type Props = {
  accounts: Account[]
  portfolio: Portfolio
  portfolios: Portfolio[]
  targets: ActiveProductTarget[]
  isLoading: boolean
  isError: boolean
  onRefresh: () => void
}

export function PortfolioAssignmentSection({ accounts, portfolio, portfolios, targets, isLoading, isError, onRefresh }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className={typeScale.caption}>{portfolioListText.assignmentDescription}</p>
      <Button variant="outline" size="sm" className="min-h-11" onClick={onRefresh}>{portfolioListText.refreshAssignments}</Button>
      {isLoading ? <p>{portfolioListText.assignmentLoading}</p> : isError ? (
        <p role="alert">{portfolioListText.assignmentLoadError}</p>
      ) : targets.length === 0 ? <p>{portfolioListText.assignmentEmpty}</p> : (
        <div className="max-w-full overflow-x-auto">
          <table aria-label={portfolioListText.assignmentHeading} className={`${typeScale.caption} w-full whitespace-nowrap text-left`}>
            <thead><tr>
              {portfolioListText.assignmentColumns.map((title, index) => (
                <th key={title} scope="col" className={`border-b border-stone-200 py-1.5 font-medium ${index === 0 ? 'w-9 min-w-9 max-w-9 whitespace-nowrap px-1 text-center' : 'px-2'}`}>{title}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-stone-100">
              {targets.map(target => (
                <PortfolioAssignmentRow key={target.key} target={target} portfolioId={portfolio.id}
                  isaStartDate={accounts.find(account => account.id === target.accountId)?.productPlans?.['01']?.startDate}
                  otherName={portfolios.find(p => p.id === target.assignedPortfolioId)?.name} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
