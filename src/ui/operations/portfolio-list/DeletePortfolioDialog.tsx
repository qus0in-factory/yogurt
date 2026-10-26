import { useState } from 'react'
import { PortfolioApiError } from '../../../app/portfolio/errors'
import { useDeletePortfolio } from '../../../app/portfolio/queries'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { portfolioListText } from '../../glossary/portfolio-list'
import { cn } from '../../lib/cn'
import { typeScale } from '../../styles/type-scale'
import type { ActiveProductTarget } from './portfolio-list-model'

type DeletePortfolioDialogProps = {
  portfolio: Portfolio
  assignedTargets: ActiveProductTarget[]
  onClose: () => void
}

export function DeletePortfolioDialog({
  portfolio,
  assignedTargets,
  onClose,
}: DeletePortfolioDialogProps) {
  const deletePortfolio = useDeletePortfolio()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [inUseError, setInUseError] = useState(false)

  const handleConfirm = () => {
    setErrorMessage(null)
    deletePortfolio.mutate(portfolio.id, {
      onSuccess: () => onClose(),
      onError: (error) => {
        if (error instanceof PortfolioApiError && (error.status === 409 || error.code === 'PORTFOLIO_IN_USE')) {
          setInUseError(true)
          setErrorMessage(portfolioListText.deleteInUseError)
          return
        }
        setErrorMessage(portfolioListText.deleteFailedError)
      },
    })
  }

  return (
    <Dialog open onClose={onClose} title={portfolioListText.deleteTitle}>
      <div className="flex flex-col gap-4">
        <p className={cn(typeScale.body, 'break-words')}>
          {portfolioListText.deleteConfirmBody(portfolio.name)}
        </p>
        {errorMessage ? (
          <div role="alert" className="flex flex-col gap-2 rounded-md border border-rose-200 bg-rose-50 p-3">
            <p className={cn(typeScale.body, 'text-rose-700')}>{errorMessage}</p>
            {(inUseError || assignedTargets.length > 0) && assignedTargets.length > 0 ? (
              <ul className="list-inside list-disc space-y-1">
                {assignedTargets.map((target) => (
                  <li key={target.key} className={cn(typeScale.caption, 'text-rose-800')}>
                    {target.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="min-h-11" onClick={onClose}>
            {portfolioListText.cancelButton}
          </Button>
          <Button
            className="min-h-11 bg-rose-600 text-white hover:bg-rose-700"
            disabled={deletePortfolio.isPending}
            onClick={handleConfirm}
          >
            {portfolioListText.deleteConfirmButton}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
