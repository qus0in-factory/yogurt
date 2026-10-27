import { KIS_RATE_LIMIT_CODES } from '../../../domain/trading/kis-rate-limit'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'
import { useRebalanceDialog, type UseRebalanceDialogProps } from './useRebalanceDialog'

export type RebalanceConfirmDialogProps = UseRebalanceDialogProps

export function RebalanceConfirmDialog(props: RebalanceConfirmDialogProps) {
  const { item, price } = props
  const { qty, check, error, checkFailure, exceedAvailable, adjusted, isExecuting, isChecking, handleQtyChange, handleExecute, handleClose, retryCheck } = useRebalanceDialog(props)

  return (
    <Dialog open onClose={handleClose} title={rebalanceText.dialog.title}>
      <div className="flex flex-col gap-3">
        <p className={typeScale.body}>{item.name} ({item.code}) · <span className={item.side === 'buy' ? 'text-red-600' : 'text-blue-600'}>{rebalanceText.side[item.side]}</span></p>
        <div className="flex items-center justify-between rounded bg-stone-50 p-3">
          <span className={typeScale.label}>{rebalanceText.dialog.availableQuantity}</span>
          <span className={typeScale.number}>{check ? `${check.availableQuantity.toLocaleString('ko-KR')} ${rebalanceText.dialog.unit}` : rebalanceText.action.checking}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="confirm-order-qty" className={typeScale.label}>{rebalanceText.dialog.orderQuantity}</label>
          <input id="confirm-order-qty" type="number" min={1} max={item.orderQuantity} value={qty} onChange={(e) => handleQtyChange(Number(e.target.value))} className="w-24 rounded border border-stone-300 px-2 py-1 text-right" />
        </div>
        <p className={typeScale.caption}>{rebalanceText.dialog.quantityNotice}</p>
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>{rebalanceText.dialog.orderType}</span>
          <span className="font-medium text-stone-700">{rebalanceText.dialog.orderTypeIoc}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>{rebalanceText.dialog.orderPrice}</span>
          <span className="font-medium text-stone-700">{rebalanceText.dialog.estimatedPrice(check?.price ?? price)}</span>
        </div>
        <div className="flex items-center justify-between"><span className={typeScale.label}>{rebalanceText.dialog.estimatedAmount}</span><span className={typeScale.number}>{(qty * (check?.price ?? price)).toLocaleString('ko-KR')}원</span></div>
        {isExecuting && <p role="status" className={typeScale.caption}>{rebalanceText.action.executing}</p>}
        {isChecking && <p role="status" className={typeScale.caption}>{rebalanceText.action.checkRetrying}</p>}
        {adjusted ? <p className="text-sm text-amber-700">{rebalanceText.error.quantityAdjusted(adjusted.available, adjusted.requested)}</p> : null}
        {error ? (
          <div role="alert" className="flex flex-col gap-1 text-sm text-red-600">
            <p>{error}</p>
            {checkFailure && rebalanceText.error.checkFailedDetail(checkFailure.stage, checkFailure.kisCode) ? (
              <p>{rebalanceText.error.checkFailedDetail(checkFailure.stage, checkFailure.kisCode)}</p>
            ) : null}
            {checkFailure?.kisMessage ? <p>{checkFailure.kisMessage}</p> : null}
            {checkFailure?.kisCode && KIS_RATE_LIMIT_CODES.has(checkFailure.kisCode) ? <p>{rebalanceText.error.checkFailedRateLimited}</p> : null}
            <Button variant="outline" className="min-h-11 px-4 self-start" disabled={isExecuting || isChecking} onClick={retryCheck}>{rebalanceText.action.retry}</Button>
          </div>
        ) : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" className="min-h-11 px-4" disabled={isExecuting} onClick={handleClose}>{rebalanceText.action.cancel}</Button>
          <Button className="min-h-11 px-4" disabled={isExecuting || isChecking || !check} onClick={handleExecute}>{isExecuting ? rebalanceText.action.executing : rebalanceText.action.execute}</Button>
        </div>
      </div>
    </Dialog>
  )
}
