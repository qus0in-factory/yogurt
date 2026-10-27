export const REBALANCE_ORDERS_STORAGE_KEY = 'yogurt:rebalance-orders'

export type StoredOrderStatus = 'pending' | 'unknown' | 'done'

export type StoredRebalanceOrder = {
  requestId: string; requestedAt?: string
  state: StoredOrderStatus
  orderQuantity?: number
  orderId?: string
  updatedAt: string
}

export type StoredRebalanceOrders = Record<string, StoredRebalanceOrder>

export function toRebalanceOrderKey(accountId: string, productCode: string, code: string, side: string): string | null {
  if (side === 'none' || !side) return null
  return `${accountId}:${productCode}:${code}:${side}`
}

export function loadStoredOrders(): StoredRebalanceOrders {
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(REBALANCE_ORDERS_STORAGE_KEY) : null
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: StoredRebalanceOrders = {}
    for (const [k, v] of Object.entries(parsed)) {
      const parts = k.split(':')
      if (parts.length === 4 && (parts[3] === 'buy' || parts[3] === 'sell') && typeof v === 'object' && v !== null) {
        result[k] = v as StoredRebalanceOrder
      }
    }
    return result
  } catch {
    return {}
  }
}

export function saveStoredOrders(orders: StoredRebalanceOrders): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(REBALANCE_ORDERS_STORAGE_KEY, JSON.stringify(orders))
    }
  } catch {
    /* ignore */
  }
}

export function saveOrderRecord(
  orders: StoredRebalanceOrders, key: string, requestId: string, state: StoredOrderStatus, orderQuantity?: number, orderId?: string,
): StoredRebalanceOrders {
  const updated: StoredRebalanceOrders = {
    ...orders,
    [key]: { requestId, requestedAt: orders[key]?.requestId === requestId ? (orders[key].requestedAt ?? orders[key].updatedAt) : new Date().toISOString(), state, orderQuantity, orderId, updatedAt: orders[key]?.requestId === requestId ? orders[key].updatedAt : new Date().toISOString() },
  }
  saveStoredOrders(updated)
  return updated
}

export function removeOrderRecord(orders: StoredRebalanceOrders, key: string): StoredRebalanceOrders {
  const updated = { ...orders }
  delete updated[key]
  saveStoredOrders(updated)
  return updated
}

export function clearDoneOrders(orders: StoredRebalanceOrders, accountId?: string, productCode?: string): StoredRebalanceOrders {
  const updated: StoredRebalanceOrders = {}
  for (const [k, v] of Object.entries(orders)) {
    if (v.state === 'done') {
      const [acc, prod] = k.split(':')
      if (accountId && productCode && (acc !== accountId || prod !== productCode)) {
        updated[k] = v
      }
    } else {
      updated[k] = v
    }
  }
  saveStoredOrders(updated)
  return updated
}
