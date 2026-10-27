import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { checkPreOrder, executeOrder } from '../../../app/trading/orders-client'
import type { PreOrderCheckOutput } from '../../../app/trading/orders-client'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  item: RebalanceItem; accountId: string; productCode: string; price: number
  onClose: () => void; onSuccess: (code: string, orderId: string) => void
}

export function RebalanceConfirmDialog({ item, accountId, productCode, price, onClose, onSuccess }: Props) {
  const [qty, setQty] = useState(item.orderQuantity)
  const [check, setCheck] = useState<PreOrderCheckOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const requestId = useRef(`req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    checkPreOrder({ accountId, productCode, code: item.code, side: item.side === 'sell' ? 'sell' : 'buy', quantity: item.orderQuantity, price })
      .then(setCheck)
      .catch(() => setError(rebalanceText.error.checkFailed))
  }, [accountId, productCode, item, price])

  const handleQtyChange = (val: number) => {
    const clamped = Math.max(1, Math.min(item.orderQuantity, Math.floor(val) || 1))
    setQty(clamped)
  }

  const handleExecute = async () => {
    if (isExecuting || item.side === 'none') return
    setIsExecuting(true)
    setError(null)
    const res = await executeOrder({
      requestId: requestId.current, accountId, productCode,
      code: item.code, side: item.side, quantity: qty, price,
    }).catch(() => null)
    setIsExecuting(false)
    if (res?.success && res.orderId) {
      toast.success(rebalanceText.orderCompleted(res.orderId))
      onSuccess(item.code, res.orderId)
      onClose()
    } else {
      setError(res?.message ?? rebalanceText.error.orderFailed)
    }
  }

  return (
    <Dialog open onClose={onClose} title={rebalanceText.dialog.title}>
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
        <div className="flex items-center justify-between">
          <span className={typeScale.label}>{rebalanceText.dialog.estimatedAmount}</span>
          <span className={typeScale.number}>{(qty * (check?.price ?? price)).toLocaleString('ko-KR')}원</span>
        </div>
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" className="min-h-11 px-4" onClick={onClose}>{rebalanceText.action.cancel}</Button>
          <Button className="min-h-11 px-4" disabled={isExecuting || !check} onClick={handleExecute}>{isExecuting ? rebalanceText.action.executing : rebalanceText.action.execute}</Button>
        </div>
      </div>
    </Dialog>
  )
}
