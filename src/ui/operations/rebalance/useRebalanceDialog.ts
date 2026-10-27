import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { executeOrder, type PreOrderCheckOutput } from '../../../app/trading/orders-client'
import { newRequestId } from '../../../app/trading/order-protocol'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { marketText } from '../../glossary/market'
import { rebalanceText } from '../../glossary/rebalance'
import { isConfirmedRejection } from './rebalance-order-rules'
import { checkFailureData } from './rebalance-check-failure'
import { runRebalanceCheck, toClosedMsg, type AdjustedInfo } from './rebalance-check-runner'

export type UseRebalanceDialogProps = {
  item: RebalanceItem; accountId: string; productCode: string; price: number; requestId?: string
  onClose: () => void; onSuccess: (code: string, orderId: string, executedQty?: number) => void
  onUnknown?: (code: string) => void; onFailure?: (code: string) => void
  onStart?: (code: string) => void
}

export function useRebalanceDialog({ item, accountId, productCode, price, requestId, onClose, onSuccess, onUnknown, onFailure, onStart }: UseRebalanceDialogProps) {
  const [qty, setQty] = useState(item.orderQuantity), [check, setCheck] = useState<PreOrderCheckOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkFailure, setCheckFailure] = useState<{ stage?: string; kisCode?: string; kisMessage?: string } | null>(null)
  const [exceedAvailable, setExceedAvailable] = useState<number | null>(null)
  const [adjusted, setAdjusted] = useState<AdjustedInfo | null>(null)
  const [isExecuting, setIsExecuting] = useState(false), [isChecking, setIsChecking] = useState(false)
  const isMounted = useRef(true)
  const [fallbackId] = useState(newRequestId), effectiveId = requestId || fallbackId

  const handleClose = () => { if (!isExecuting) onClose() }

  const applyOutcome = (outcome: Awaited<ReturnType<typeof runRebalanceCheck>>) => {
    setQty(outcome.qty); setCheck(outcome.check); setError(outcome.error)
    setCheckFailure(outcome.checkFailure); setExceedAvailable(outcome.exceedAvailable); setAdjusted(outcome.adjusted)
  }

  const run = async (quantity: number) => {
    setIsChecking(true)
    const outcome = await runRebalanceCheck({ item, accountId, productCode, price, quantity }, () => !isMounted.current)
    if (!isMounted.current) return
    applyOutcome(outcome); setIsChecking(false)
  }

  useEffect(() => {
    isMounted.current = true
    void run(item.orderQuantity)
    return () => { isMounted.current = false }
  }, [accountId, productCode, item, price])

  const handleQtyChange = (val: number) => {
    const maxQty = exceedAvailable !== null ? Math.min(item.orderQuantity, Math.max(1, exceedAvailable)) : item.orderQuantity
    setQty(Math.max(1, Math.min(maxQty, Math.floor(val) || 1)))
  }

  const handleExecute = async () => {
    if (isExecuting || isChecking || item.side === 'none') return
    setIsExecuting(true); setError(null); setCheckFailure(null); setExceedAvailable(null); setAdjusted(null)
    onStart?.(item.code)
    try {
      const res = await executeOrder({ requestId: effectiveId, accountId, productCode, code: item.code, side: item.side, quantity: qty, price })
      if (res.success && res.orderId) {
        toast.success(rebalanceText.orderCompleted(res.orderId)); onSuccess(item.code, res.orderId, qty); onClose()
      } else if (isConfirmedRejection(res.failureCode)) {
        onFailure?.(item.code)
        setError(res.failureCode === 'MARKET_CLOSED' ? toClosedMsg(res.reason, res.nextOpenAt) : (res.message || rebalanceText.error.orderFailed))
      } else {
        onUnknown?.(item.code); setError(res.message || marketText.unknownOrder)
      }
    } catch {
      onUnknown?.(item.code); setError(marketText.unknownOrder)
    } finally {
      setIsExecuting(false)
    }
  }

  const retryCheck = () => { void run(item.orderQuantity) }

  return { qty, check, error, checkFailure, exceedAvailable, adjusted, isExecuting, isChecking, handleQtyChange, handleExecute, handleClose, retryCheck, effectiveId }
}