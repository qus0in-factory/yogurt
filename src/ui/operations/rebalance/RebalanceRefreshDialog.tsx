import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  open: boolean
  unconfirmedCount: number
  onConfirm: () => void
  onClose: () => void
}

export function RebalanceRefreshDialog({ open, unconfirmedCount, onConfirm, onClose }: Props) {
  const message = unconfirmedCount > 0
    ? rebalanceText.action.refreshPlanConfirmWithCount(unconfirmedCount)
    : rebalanceText.action.refreshPlanConfirm

  return (
    <Dialog open={open} onClose={onClose} title={rebalanceText.action.refreshPlan}>
      <div className="flex flex-col gap-6">
        <p className={`${typeScale.body} text-stone-700`}>{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="min-h-11 px-4" onClick={onClose}>
            {rebalanceText.action.cancel}
          </Button>
          <Button variant="default" className="min-h-11 px-4" onClick={onConfirm}>
            {rebalanceText.action.refresh}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
