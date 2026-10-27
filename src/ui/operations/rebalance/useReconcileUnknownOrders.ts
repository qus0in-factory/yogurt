import { useEffect, useRef } from 'react'
import { fetchDailyOrders } from '../../../app/trading/daily-orders-client'
import type { StoredRebalanceOrders } from './rebalance-order-store'
type Target = { accountId: string; productCode: string } | null
export type ReconcileReason = 'past' | 'absent'
const KST = 9 * 3_600_000
const dayOf = (value: string) => {
  const stamp = Date.parse(value)
  return Number.isFinite(stamp) ? new Date(stamp + KST).toISOString().slice(0, 10) : null
}

export function useReconcileUnknownOrders(target: Target, orders: StoredRebalanceOrders, resolve: (key: string, requestId: string, orderId: string | null, reason?: ReconcileReason) => void, activeIds: Record<string, string> = {}) {
  const scope = `${target?.accountId}:${target?.productCode}`
  const currentScope = useRef(scope)
  currentScope.current = scope
  const attempted = useRef(new Set<string>())
  useEffect(() => {
    if (!target || !['01', '22'].includes(target.productCode)) return
    const prefix = `${target.accountId}:${target.productCode}:`
    const today = new Date(Date.now() + KST).toISOString().slice(0, 10)
    const entries = Object.entries(orders).filter(([key, v]) => key.startsWith(prefix) && ['unknown', 'pending'].includes(v.state) && !(v.state === 'pending' && activeIds[key] === v.requestId) && !attempted.current.has(`${key}:${v.requestId}`))
    const todayEntries = entries.filter(([key, record]) => {
      const day = dayOf(record.requestedAt ?? record.updatedAt)
      if (!day) return false
      if (day < today) { resolve(key, record.requestId, null, 'past'); return false }
      return day === today
    })
    if (!todayEntries.length) return
    todayEntries.forEach(([key, v]) => attempted.current.add(`${key}:${v.requestId}`))
    void fetchDailyOrders(target.accountId, target.productCode).then((rows) => {
      if (currentScope.current !== scope) return
      for (const [key, record] of todayEntries) {
        const [, , code, side] = key.split(':')
        const requested = Date.parse(record.requestedAt ?? record.updatedAt)
        if (!Number.isFinite(requested) || record.orderQuantity === undefined) continue
        const since = requested - 120_000
        const matches = rows.filter((r) => r.code === code && r.side === side && r.orderedQty === record.orderQuantity && Date.parse(r.orderedAt) >= since)
        if (matches.length === 0) resolve(key, record.requestId, null, 'absent')
        else if (matches.length === 1) resolve(key, record.requestId, matches[0].orderNo)
      }
    }).catch(() => { /* 조회 실패는 기록 유지. 전송 POST는 호출하지 않는다. */ })
  }, [target?.accountId, target?.productCode, orders])
}
