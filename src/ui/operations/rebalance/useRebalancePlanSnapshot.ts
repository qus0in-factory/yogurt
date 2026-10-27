import { useEffect, useMemo, useState } from 'react'
import type { RebalanceInputs } from '../../../app/rebalance/types'
import { buildRebalancePlan } from '../../../domain/rebalance/plan'
import type { RebalanceItem, RebalancePlan } from '../../../domain/rebalance/types'

export type BlockReason = 'keep' | 'keep-save' | 'cash' | 'price' | 'total' | null

type Snapshot = { key: string; inputs: RebalanceInputs; keepAmount: number; at: string }
type Args = {
  key: string
  inputs?: RebalanceInputs
  keepAmount: number
  isKeepLoading: boolean
  isKeepLoadError: boolean
  isKeepSaveError: boolean
}

const hasInvalidPrice = (inputs: RebalanceInputs) => {
  if ((inputs.priceFailed ?? []).length > 0) return true
  const prices = inputs.prices ?? {}
  const priceInvalid = (code: string, direct?: number) => {
    if (typeof direct === 'number' && (!Number.isFinite(direct) || direct <= 0)) return true
    const price = prices[code] ?? direct
    return !(typeof price === 'number' && Number.isFinite(price) && price > 0)
  }
  if ((inputs.holdings ?? []).some((holding) =>
    priceInvalid(holding.code, (holding as { currentPrice?: number }).currentPrice))) return true
  return (inputs.targets ?? []).some((target) => target.kind === 'stock' && priceInvalid(target.code))
}

export function useRebalancePlanSnapshot({ key, inputs, keepAmount, isKeepLoading, isKeepLoadError, isKeepSaveError }: Args) {
  const blockedByPrice = inputs ? hasInvalidPrice(inputs) : false
  const blockedByCash = Boolean(inputs && inputs.cashSettled == null)
  const ready = Boolean(key && inputs && !isKeepLoading && !isKeepLoadError && !isKeepSaveError && !blockedByPrice && !blockedByCash)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() =>
    ready && inputs ? { key, inputs, keepAmount, at: new Date().toISOString() } : null)

  useEffect(() => {
    if (!ready || !inputs) return
    setSnapshot((prev) => prev?.key === key ? prev : { key, inputs, keepAmount, at: new Date().toISOString() })
  }, [ready, key, inputs, keepAmount])

  const active = snapshot?.key === key ? snapshot : null
  const plan = useMemo<RebalancePlan | null>(() => {
    if (!active || active.inputs.cashSettled == null || !(active.inputs.targets?.length)) return null
    return buildRebalancePlan({
      ...active.inputs,
      cash: active.inputs.cashSettled,
      keepAmount: active.keepAmount,
    })
  }, [active])

  const displayItems = useMemo<RebalanceItem[]>(() => plan?.items ?? [], [plan])
  const planPriceBlocked = plan?.warnings.some((w) => w.reason === 'NO_PRICE') ?? false
  const totalBlocked = plan?.warnings.some((w) => w.reason === 'KEEP_NOT_BELOW_TOTAL') ?? false
  const blocked: BlockReason = isKeepLoading || isKeepLoadError ? 'keep'
    : isKeepSaveError ? 'keep-save'
    : blockedByCash ? 'cash'
    : blockedByPrice || planPriceBlocked ? 'price'
      : totalBlocked ? 'total' : null
  const isStale = Boolean(active && inputs && inputs !== active.inputs); const keepChanged = Boolean(active && active.keepAmount !== keepAmount)
  const canRecalc = Boolean(inputs && !isKeepLoading && !isKeepLoadError && !isKeepSaveError && !blockedByPrice && !blockedByCash)
  const recalc = () => {
    if (canRecalc && inputs) setSnapshot({ key, inputs, keepAmount, at: new Date().toISOString() })
  }
  return {
    snapshot: active, plan, displayItems, blocked,
    isStale, keepChanged, calculatedAt: active?.at ?? null,
    canRecalc, recalc,
  }
}
