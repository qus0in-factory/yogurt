import { useState } from 'react'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { useMarketStatus } from '../../../app/market/useMarketStatus'
import { useRebalanceInputs, useTargetAccounts } from '../../../app/rebalance/useRebalanceInputs'
import { useAccounts } from '../../accounts/useAccounts'
import { marketText } from '../../glossary/market'
import { useRebalancePlanSnapshot } from './useRebalancePlanSnapshot'
import { useRebalanceBuyPhase } from './useRebalanceBuyPhase'
import { useRecalcOnFill } from './useRecalcOnFill'
import { useRebalanceFillStream } from './useRebalanceFillStream'
import { useRebalanceAutoRefresh } from './useRebalanceAutoRefresh'
import { useRebalanceOrderSync } from './useRebalanceOrderSync'
import { useSavedKeepAmount } from './useSavedKeepAmount'
export function useRebalanceSectionModel() {
  const options = useTargetAccounts(), { data: accounts } = useAccounts()
  const { data: marketStatus, isError: isMarketError } = useMarketStatus()
  const [selectedKey, setSelectedKey] = useState('')
  const [checkingItem, setCheckingItem] = useState<RebalanceItem | null>(null)
  const [isRefreshOpen, setIsRefreshOpen] = useState(false), [orderEventVersion, setOrderEventVersion] = useState(0)
  const activeKey = selectedKey || (options[0] ? `${options[0].accountId}:${options[0].productCode}` : '')
  const currentTarget = options.find((opt) => `${opt.accountId}:${opt.productCode}` === activeKey) ?? null
  const keep = useSavedKeepAmount(currentTarget?.accountId ?? '', currentTarget?.productCode ?? '')
  const inputs = useRebalanceInputs(currentTarget)
  const plan = useRebalancePlanSnapshot({
    key: activeKey, inputs: inputs.data, keepAmount: keep.keepAmount, isKeepLoading: keep.isLoading,
    isKeepLoadError: keep.isLoadError, isKeepSaveError: keep.isError,
  })
  const view = plan.snapshot?.inputs ?? null
  const isIsa = currentTarget?.productCode === '01'
  const isaPlan = isIsa ? accounts?.find((a) => a.id === currentTarget?.accountId)?.productPlans?.['01'] : null
  const cashAvailable = view?.cashAvailable ?? 0, cashSettled = view?.cashSettled ?? 0
  const totalAmount = view ? view.holdings.reduce((s, h) => s + h.evaluationAmount, 0) + cashSettled : 0
  const isMarketOpen = !isMarketError && (marketStatus ? marketStatus.open : true)
  const marketReason = marketStatus?.reason
    ? (marketText.reasons[marketStatus.reason] ?? marketText.reasons['closed-hours']) : undefined
  const orders = useRebalanceOrderSync(currentTarget)
  const fills = useRebalanceFillStream(currentTarget, orders.orders, orders.handleClearKey)
  const { refresh: refreshInputs } = useRebalanceAutoRefresh(currentTarget)
  const gate = useRebalanceBuyPhase({
    targetKey: activeKey, sellEvents: fills.sellEvents, isFetching: inputs.isFetching,
    cashUpdatedAt: inputs.dataUpdatedAt,
    isCashError: inputs.isError, cashSettled: inputs.data?.cashSettled ?? 0, keepAmount: plan.snapshot?.keepAmount ?? 0,
    unknownKeys: orders.unknownKeys, completedKeys: orders.completedKeys,
    fillStatusesByKey: fills.fillStatusesByKey, refresh: refreshInputs,
  })
  const recalc = useRecalcOnFill({
    targetKey: activeKey, fillEventsByKey: fills.fillEventsByKey, fillEventList: fills.fillEventList,
    savedKeepVersion: keep.savedKeepVersion, orderEventVersion: orderEventVersion + orders.cleanupVersion,
    inputs: inputs.data, isFetching: inputs.isFetching, isError: inputs.isError, dataUpdatedAt: inputs.dataUpdatedAt,
    keepUpdatedAt: keep.keepUpdatedAt, isKeepFetching: keep.isKeepFetching,
    isKeepLoadError: keep.isLoadError, isKeepSaveError: keep.isError,
    blocked: plan.blocked !== null, canRecalc: plan.canRecalc, recalc: plan.recalc,
    refreshInputs: () => { inputs.refetch ? void inputs.refetch() : refreshInputs() },
    refreshKeep: () => { keep.refetchKeepAmount?.() },
  })
  const handleOrderStart = () => { if (checkingItem) orders.handleStart(checkingItem) }
  const handleOrderSuccess = (_code: string, orderId: string, qty?: number) => {
    if (checkingItem) { orders.handleSuccess(checkingItem, orderId, qty); refreshInputs() }
  }
  const handleOrderFailure = () => {
    if (checkingItem) { orders.handleFailure(checkingItem); setOrderEventVersion((v) => v + 1) }
  }
  const handleOrderUnknown = () => { if (checkingItem) orders.handleUnknown(checkingItem) }
  const handleCancelled = (key: string) => {
    orders.handleClearKey(key); fills.reconnect(); setOrderEventVersion((v) => v + 1)
  }
  return {
    target: {
      options, accounts, selectedKey, setSelectedKey, activeKey, currentTarget,
      checkingItem, setCheckingItem, isRefreshOpen, setIsRefreshOpen,
    }, keep, inputs, plan,
    market: { status: marketStatus, isError: isMarketError, isOpen: isMarketOpen, reason: marketReason },
    summary: { view, isIsa, isaPlan, cashAvailable, cashSettled, totalAmount },
    orders: {
      ...orders, handleOrderStart, handleOrderSuccess, handleOrderFailure,
      handleOrderUnknown, handleCancelled,
    },
    fills, gate, recalc }
}
export type RebalanceSectionModel = ReturnType<typeof useRebalanceSectionModel>
