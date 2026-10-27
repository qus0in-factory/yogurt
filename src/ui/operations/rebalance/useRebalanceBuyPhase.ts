import { useEffect, useState } from 'react'
import { buyLimitCash } from '../../../domain/rebalance/buy-limit'
import type { RebalancePlan } from '../../../domain/rebalance/types'
import type { SellFillEvent } from './useRebalanceFillStream'

export type BuyBlockReason = 'wait' | 'cancelled' | null
type Args = {
  targetKey?: string
  plan?: RebalancePlan | null
  sellEvents: SellFillEvent[]
  calculatedAt?: string | null
  isFetching: boolean
  cashSettled: number
  cashUpdatedAt?: number
  isCashError?: boolean
  keepAmount: number
  completedKeys?: Set<string>
  unknownKeys?: Set<string>
  fillStatusesByKey?: Record<string, string>
  refresh: () => void
}

const terminal = (status: string) => status === 'filled' || status === 'closed_partial'
const live = (status: string | undefined) => !['filled', 'closed_partial', 'cancelled'].includes(status ?? '')

export function useRebalanceBuyPhase({ sellEvents, isFetching, cashSettled, keepAmount, refresh, cashUpdatedAt = 0, isCashError = false, completedKeys, unknownKeys, fillStatusesByKey }: Args) {
  const latest = new Map<string, string>()
  for (const event of sellEvents) latest.set(event.pair, event.status)
  const eventLive = [...latest.values()].some(live)
  const statusLive = Object.entries(fillStatusesByKey ?? {}).some(([key, status]) => key.endsWith(':sell') && live(status))
  const unknownLive = [...(unknownKeys ?? [])].some((key) => key.endsWith(':sell'))
  const acceptedLive = [...(completedKeys ?? [])].some((key) => key.endsWith(':sell') && live(fillStatusesByKey?.[key]))
  const inProgressSell = eventLive || statusLive || unknownLive || acceptedLive
  const terminalAt = sellEvents.reduce((max, event) => terminal(event.status) ? Math.max(max, event.at) : max, 0)
  const freshCash = Number.isFinite(cashUpdatedAt) && cashUpdatedAt > terminalAt
  const gateOpen = !isFetching && !isCashError && !inProgressSell && freshCash
  const blockedReason: BuyBlockReason = inProgressSell || !freshCash ? 'wait' : null
  const [refreshedAt, setRefreshedAt] = useState(0)

  useEffect(() => {
    if (!terminalAt || refreshedAt === terminalAt || isFetching || isCashError) return
    setRefreshedAt(terminalAt)
    refresh()
  }, [terminalAt, refreshedAt, isFetching, isCashError, refresh])

  return {
    gateOpen,
    buyLimit: gateOpen ? buyLimitCash(cashSettled, keepAmount) : 0,
    blockedReason,
  }
}
