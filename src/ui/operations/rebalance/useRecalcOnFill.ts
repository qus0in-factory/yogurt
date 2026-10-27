import { useEffect, useRef, useState } from 'react'
import type { RebalanceInputs } from '../../../app/rebalance/types'
import type { FillChipStatus } from './RebalanceFillChip'
import type { FillEvent } from './useRebalanceFillStream'

type Args = {
  targetKey?: string
  fillEventsByKey: Record<string, FillChipStatus>
  fillEventList?: FillEvent[]
  savedKeepVersion?: number
  orderEventVersion?: number
  inputs?: RebalanceInputs
  isFetching: boolean
  isError: boolean
  dataUpdatedAt?: number
  keepUpdatedAt?: number
  isKeepFetching?: boolean
  isKeepLoadError: boolean
  isKeepSaveError: boolean
  blocked: boolean
  canRecalc: boolean
  recalc: () => void
  refreshInputs: () => void
  refreshKeep?: () => void
}
type Pending = { sinceInputs: number; sinceKeep: number | null; events: string[] }
const terminal = (status: FillChipStatus) => status === 'filled' || status === 'closed_partial'
const keysOf = (list: FillEvent[] | undefined, map: Record<string, FillChipStatus>) => list
  ? list.filter((event) => terminal(event.status)).map((event) => `${event.orderId}:${event.status}`)
  : Object.entries(map).filter(([, status]) => terminal(status)).sort(([a], [b]) => a.localeCompare(b)).map(([key, status]) => `${key}:${status}`)

// 저장 성공·체결 종료·주문 실패·취소 성공·수동 재계산이 모두 이 한 경로를 쓴다.
export function useRecalcOnFill({ targetKey, fillEventsByKey, fillEventList, savedKeepVersion = 0, orderEventVersion = 0, inputs, isFetching, isError, dataUpdatedAt = 0, keepUpdatedAt, isKeepFetching = false, isKeepLoadError, isKeepSaveError, blocked, canRecalc, recalc, refreshInputs, refreshKeep }: Args) {
  const seen = useRef(new Set<string>()), waiting = useRef(new Set<string>()), savedSeen = useRef(savedKeepVersion), orderSeen = useRef(orderEventVersion)
  const pendingRef = useRef<Pending | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const fillKeys = [...new Set(keysOf(fillEventList, fillEventsByKey))]

  useEffect(() => {
    seen.current.clear(); waiting.current.clear(); savedSeen.current = savedKeepVersion; orderSeen.current = orderEventVersion
    pendingRef.current = null; setIsRecalculating(false)
  }, [targetKey])

  const start = (events: string[]) => {
    if (pendingRef.current || blocked || !canRecalc || isError || isKeepLoadError || isKeepSaveError) return
    pendingRef.current = { sinceInputs: dataUpdatedAt, sinceKeep: keepUpdatedAt ?? null, events }
    setIsRecalculating(true); refreshInputs(); refreshKeep?.()
  }

  useEffect(() => {
    fillKeys.forEach((key) => { if (!seen.current.has(key)) waiting.current.add(key) })
    if (savedKeepVersion > savedSeen.current) { savedSeen.current = savedKeepVersion; waiting.current.add(`save:${savedKeepVersion}`) }
    if (orderEventVersion > orderSeen.current) { orderSeen.current = orderEventVersion; waiting.current.add(`order:${orderEventVersion}`) }
    if (pendingRef.current || waiting.current.size === 0) return
    start([...waiting.current])
  }, [fillKeys.join('|'), savedKeepVersion, orderEventVersion, blocked, canRecalc, dataUpdatedAt, keepUpdatedAt, isRecalculating, isError, isKeepLoadError, isKeepSaveError, refreshInputs, refreshKeep])

  useEffect(() => {
    const pending = pendingRef.current
    if (!pending) return
    if (isFetching || isKeepFetching) return
    const failed = isError || isKeepLoadError || isKeepSaveError || blocked || !canRecalc
    if (failed) { pendingRef.current = null; setIsRecalculating(false); return }
    if (!inputs || dataUpdatedAt <= pending.sinceInputs) return
    if (pending.sinceKeep !== null && keepUpdatedAt !== undefined && keepUpdatedAt <= pending.sinceKeep) return
    pending.events.forEach((key) => { seen.current.add(key); waiting.current.delete(key) })
    pendingRef.current = null; setIsRecalculating(false); recalc()
  }, [isRecalculating, isFetching, isError, inputs, dataUpdatedAt, keepUpdatedAt, isKeepFetching, isKeepLoadError, isKeepSaveError, blocked, canRecalc, recalc])

  const recalcNow = () => {
    if (isFetching || isKeepFetching) return
    start([])
  }
  return { recalcNow, isRecalculating }
}
