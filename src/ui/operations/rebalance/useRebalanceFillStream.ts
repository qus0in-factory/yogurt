import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { REBALANCE_INPUTS_QUERY_KEY } from '../../../app/rebalance/queries'
import { subscribeFills, type FillUpdate } from '../../../app/trading/fill-stream'
import type { StoredRebalanceOrders } from './rebalance-order-store'
type Target = { accountId: string; productCode: string } | null
type FillStatus = FillUpdate['status'] | 'closed_partial' | 'not_found'
export type SellFillEvent = { pair: string; status: FillStatus; at: number }; export type FillEvent = SellFillEvent & { orderId: string }
const CHUNK = 7
export function useRebalanceFillStream(
  currentTarget: Target, orders: StoredRebalanceOrders, onClearKey: (key: string) => void,
) {
  const queryClient = useQueryClient(), [seq, setSeq] = useState(0), [chunkIdx, setChunkIdx] = useState(0)
  const [isStreamClosed, setIsStreamClosed] = useState(false), [isStreamError, setIsStreamError] = useState(false)
  const [fillStatuses, setFillStatuses] = useState<Record<string, FillStatus>>({}), [sellEvents, setSellEvents] = useState<SellFillEvent[]>([]), [fillEvents, setFillEvents] = useState<Record<string, FillStatus>>({}), [fillEventList, setFillEventList] = useState<FillEvent[]>([])
  const targetKey = currentTarget ? `${currentTarget.accountId}:${currentTarget.productCode}` : ''
  useEffect(() => {
    setChunkIdx(0); setFillStatuses({}); setFillEvents({}); setFillEventList([]); setSellEvents([]); setIsStreamClosed(false); setIsStreamError(false)
  }, [targetKey])

  const doneEntries = useMemo(() => {
    if (!currentTarget) return []
    return Object.entries(orders).filter(([k, v]) => {
      const p = k.split(':')
      return p.length === 4 && p[0] === currentTarget.accountId && p[1] === currentTarget.productCode && v.state === 'done'
    })
  }, [orders, currentTarget])

  const withOrderId = useMemo(() => doneEntries.filter(([_, v]) => typeof v.orderId === 'string' && v.orderId.trim().length > 0), [doneEntries])
  const noOrderIdKeys = useMemo(() => new Set(doneEntries.filter(([_, v]) => !v.orderId).map(([k]) => `${k.split(':')[2]}:${k.split(':')[3]}`)), [doneEntries])

  const allOrderIds = useMemo(() => withOrderId.map(([_, v]) => v.orderId!), [withOrderId])
  const currentOrderIds = useMemo(() => allOrderIds.slice(chunkIdx * CHUNK, (chunkIdx + 1) * CHUNK), [allOrderIds, chunkIdx])
  const hasTrackable = withOrderId.length > 0
  const remainingCount = hasTrackable ? Math.max(0, allOrderIds.length - (chunkIdx + 1) * CHUNK) : 0

  useEffect(() => {
    if (!currentTarget || currentOrderIds.length === 0) { setIsStreamClosed(false); setIsStreamError(false); return }
    setIsStreamClosed(false); setIsStreamError(false)
    const unsub = (subscribeFills as any)(
      { accountId: currentTarget.accountId, productCode: currentTarget.productCode, orderIds: currentOrderIds },
      (update: FillUpdate) => {
        setFillStatuses((prev) => ({ ...prev, [update.orderId]: update.status as FillStatus }))
        const entry = withOrderId.find(([_, v]) => v.orderId === update.orderId)
        if (entry) {
          const p = entry[0].split(':')
          if (p[3] === 'sell') setSellEvents((prev) => [...prev, { pair: `${p[2]}:sell`, status: update.status as FillStatus, at: Date.now() }])
          setFillEvents((prev) => ({ ...prev, [`${p[2]}:${p[3]}`]: update.status as FillStatus }))
          setFillEventList((prev) => [...prev, { orderId: update.orderId, pair: `${p[2]}:${p[3]}`, status: update.status as FillStatus, at: Date.now() }])
          if ((update.status as FillStatus) === 'filled' || (update.status as FillStatus) === 'closed_partial' || update.status === 'cancelled') onClearKey(entry[0])
        }
        if ((update.status as FillStatus) === 'filled' || (update.status as FillStatus) === 'closed_partial' || update.status === 'cancelled') {
          const tuple = [currentTarget.accountId, currentTarget.productCode]
          ;[REBALANCE_INPUTS_QUERY_KEY, ['product-balance'], ['account-assets']].forEach((k) => queryClient.invalidateQueries({ queryKey: [...k, ...tuple] }))
        }
      },
      () => {
        if ((chunkIdx + 1) * CHUNK < allOrderIds.length) setChunkIdx((p) => p + 1)
        else setIsStreamClosed(true)
      },
      () => setIsStreamError(true),
    )
    return () => unsub?.()
  }, [currentTarget?.accountId, currentTarget?.productCode, currentOrderIds.join(','), seq])

  const fillStatusesByKey = useMemo(() => {
    const map: Record<string, FillStatus> = {}
    for (const [k, v] of withOrderId) {
      if (v.orderId && fillStatuses[v.orderId]) map[`${k.split(':')[2]}:${k.split(':')[3]}`] = fillStatuses[v.orderId]
    }
    return map
  }, [withOrderId, fillStatuses])

  const unconfirmedCount = doneEntries.filter(([_, v]) => !v.orderId || fillStatuses[v.orderId] !== 'filled').length
  const showCheckFailed = hasTrackable && (isStreamError || Object.values(fillStatuses).some((s) => s === 'unknown'))
  const showNotFoundClosed = hasTrackable && isStreamClosed && Object.values(fillStatuses).some((s) => s === 'not_found')
  const reconnect = () => { setChunkIdx(0); setIsStreamClosed(false); setIsStreamError(false); setSeq((s) => s + 1) }

  return { fillStatusesByKey, fillEventsByKey: fillEvents, fillEventList, isStreamClosed, isStreamError, showCheckFailed, showNotFoundClosed, remainingCount, unconfirmedCount, noOrderIdKeys, reconnect, hasDoneOrders: hasTrackable, sellEvents }
}
