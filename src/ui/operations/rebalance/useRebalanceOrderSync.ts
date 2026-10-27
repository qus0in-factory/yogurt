import { toast } from 'sonner'
import { marketText } from '../../glossary/market'
import { useMemo, useState } from 'react'
import { newRequestId } from '../../../app/trading/order-protocol'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { clearDoneOrders, loadStoredOrders, removeOrderRecord, saveOrderRecord, toRebalanceOrderKey, type StoredRebalanceOrders } from './rebalance-order-store'
import { useReconcileUnknownOrders } from './useReconcileUnknownOrders'

type Target = { accountId: string; productCode: string } | null

export function useRebalanceOrderSync(currentTarget: Target) {
  const [orders, setOrders] = useState<StoredRebalanceOrders>(loadStoredOrders)
  const [activeIds, setActiveIds] = useState<Record<string, string>>({})
  const [cleanupVersion, setCleanupVersion] = useState(0)
  const itemKey = (it: RebalanceItem): string | null => {
    if (!currentTarget || it.side === 'none') return null
    return toRebalanceOrderKey(currentTarget.accountId, currentTarget.productCode, it.code, it.side)
  }

  const { completedKeys, unknownKeys } = useMemo(() => {
    const c = new Set<string>(), u = new Set<string>()
    if (!currentTarget) return { completedKeys: c, unknownKeys: u }
    for (const [k, v] of Object.entries(orders)) {
      const [acc, prod, code, side] = k.split(':')
      if (acc === currentTarget.accountId && prod === currentTarget.productCode && side && side !== 'none') {
        const pair = `${code}:${side}`
        if (v.state === 'done') c.add(pair)
        if (v.state === 'pending' || v.state === 'unknown') u.add(pair)
      }
    }
    return { completedKeys: c, unknownKeys: u }
  }, [orders, currentTarget])

  const getRequestId = (it: RebalanceItem) => {
    const k = itemKey(it)
    if (!k) return newRequestId()
    if (orders[k]?.requestId) return orders[k].requestId
    if (activeIds[k]) return activeIds[k]
    const id = newRequestId(); setActiveIds((p) => ({ ...p, [k]: id })); return id
  }

  const handleStart = (it: RebalanceItem, qty?: number) => {
    const k = itemKey(it); if (!k) return
    setOrders((p) => saveOrderRecord(p, k, getRequestId(it), 'pending', qty ?? it.orderQuantity))
  }
  const handleSuccess = (it: RebalanceItem, orderId?: string, qty?: number) => {
    const k = itemKey(it); if (!k) return
    setOrders((p) => saveOrderRecord(p, k, getRequestId(it), 'done', qty ?? it.orderQuantity, orderId))
    setActiveIds((p) => { const n = { ...p }; delete n[k]; return n })
  }
  const handleUnknown = (it: RebalanceItem, qty?: number) => {
    const k = itemKey(it); if (!k) return
    setOrders((p) => saveOrderRecord(p, k, getRequestId(it), 'unknown', qty ?? p[k]?.orderQuantity ?? it.orderQuantity))
  }
  const handleFailure = (it: RebalanceItem) => {
    const k = itemKey(it); if (!k) return
    setOrders((p) => removeOrderRecord(p, k))
    setActiveIds((p) => { const n = { ...p }; delete n[k]; return n })
  }
  const handleClearKey = (key: string) => {
    setOrders((p) => removeOrderRecord(p, key))
    setActiveIds((p) => { const n = { ...p }; delete n[key]; return n })
  }
  const handleClearDone = () => {
    if (!currentTarget) return
    setOrders((p) => clearDoneOrders(p, currentTarget.accountId, currentTarget.productCode))
  }

  useReconcileUnknownOrders(currentTarget, orders, (key, requestId, orderId, reason) => {
    if (reason === 'past') { toast.info(marketText.unknownRecord.pastDay); setCleanupVersion((v) => v + 1) }
    else if (!orderId) toast.info(marketText.unknownRecord.notAccepted)
    setActiveIds((previous) => { const next = { ...previous }; if (next[key] === requestId) delete next[key]; return next })
    setOrders((previous) => {
      const record = previous[key]
      if (!record || record.requestId !== requestId || !['unknown', 'pending'].includes(record.state)) return previous
      return orderId ? saveOrderRecord(previous, key, requestId, 'done', record.orderQuantity, orderId) : removeOrderRecord(previous, key)
    })
  }, activeIds)
  return { orders, completedKeys, unknownKeys, cleanupVersion, getRequestId, handleStart, handleSuccess, handleUnknown, handleFailure, handleClearDone, handleClearKey }
}
