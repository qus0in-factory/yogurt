import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { OPEN_ORDERS_QUERY_KEY, useOpenOrders } from '../../../app/rebalance/queries'
import { cancelOpenOrder, type OpenOrder } from '../../../app/trading/open-orders-client'
import { X } from 'lucide-react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { InfoTooltip } from '../../components/InfoTooltip'
import { Sensitive } from '../../components/Sensitive'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'
import { toRebalanceOrderKey } from './rebalance-order-store'

type Target = { accountId: string; productCode: string } | null

type Props = { target: Target; onCancelled?: (orderKey: string) => void }

export function OpenOrdersPanel({ target, onCancelled }: Props) {
  const queryClient = useQueryClient()
  const { data } = useOpenOrders(target?.accountId ?? '', target?.productCode ?? '')
  const [confirming, setConfirming] = useState<OpenOrder | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  if (!target || !data || data.length === 0) return null
  const t = rebalanceText.openOrders
  const runCancel = async (order: OpenOrder) => {
    if (cancellingId !== null) return
    setCancellingId(order.orderId)
    setFailure(null)
    try {
      const res = await cancelOpenOrder(target.accountId, target.productCode, order.orderId, order.orgNo)
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: [...OPEN_ORDERS_QUERY_KEY, target.accountId, target.productCode] })
        const key = toRebalanceOrderKey(target.accountId, target.productCode, order.code, order.side)
        if (key) onCancelled?.(key)
        setConfirming(null)
      } else {
        setFailure(res.message)
      }
    } catch {
      setFailure(rebalanceText.error.orderFailed)
    } finally {
      setCancellingId(null)
    }
  }
  return (
    <section aria-label={t.title} className="rounded-lg border border-stone-200 bg-white p-4">
      <p className={typeScale.section}>{t.title}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {data.map((order) => (
          <li key={order.orderId} className="flex items-center justify-between gap-2 border-t border-stone-100 py-2">
            <div className="flex min-w-0 flex-col">
              <span className={`font-medium ${typeScale.body}`}>{order.name} <span className="font-mono text-xs text-stone-400">{order.code}</span></span>
              <span className={typeScale.caption}>{rebalanceText.side[order.side]} · 주문 {order.orderQty}주 · 체결 {order.filledQty}주 · 잔량 {order.remainingQty}주 · <Sensitive>{order.price.toLocaleString('ko-KR')}원</Sensitive></span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Button variant="outline" size="icon" className="min-h-11 min-w-11" disabled={cancellingId !== null || order.cancellable === false} aria-label={`${order.name} ${t.cancel}`} onClick={() => { setFailure(null); setConfirming(order) }}><X aria-hidden="true" className="h-4 w-4" /></Button>
              <InfoTooltip label={t.cancel}>{t.cancel}</InfoTooltip>
            </span>
          </li>
        ))}
      </ul>
      <Dialog open={confirming !== null} onClose={() => { if (cancellingId === null) setConfirming(null) }} title={t.confirmTitle}>
        <div className="flex flex-col gap-3">
          {confirming ? <p className={typeScale.body}>{t.confirmMessage(confirming.name, confirming.remainingQty)}</p> : null}
          {failure ? <p role="alert" className="text-sm text-red-600">{failure}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="min-h-11 px-4" disabled={cancellingId !== null} onClick={() => setConfirming(null)}>{rebalanceText.action.cancel}</Button>
            <Button className="min-h-11 px-4" disabled={cancellingId !== null} onClick={() => { if (confirming) void runCancel(confirming) }}>{t.confirmOk}</Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
