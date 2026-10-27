import { AlertCircle, RotateCcw, Search } from 'lucide-react'
import { Button } from '../../components/Button'
import { StatusBadge } from './RebalanceFillChip'
import { rebalanceText } from '../../glossary/rebalance'
import { RebalanceTable } from './RebalanceTable'
import { OpenOrdersPanel } from './OpenOrdersPanel'
import { RebalanceRefreshDialog } from './RebalanceRefreshDialog'
import { RebalanceConfirmDialog } from './RebalanceConfirmDialog'
import type { RebalanceSectionModel } from './useRebalanceSectionModel'
export function RebalancePlanPanel({ model: m }: { model: RebalanceSectionModel }) {
  if (m.plan.blocked || m.inputs.isLoading || !m.plan.plan) return null
  const targets = m.summary.view?.targets ?? []
  const targetBps = Object.fromEntries(targets
    .filter((t) => t.kind === 'stock' && t.code)
    .map((t) => [t.code as string, t.weightBps]))
  const cashTargetBps = targets.find((t) => t.kind === 'cash')?.weightBps ?? 0
  const buyChecking = [...m.orders.unknownKeys].some((k) => k.endsWith(':buy'))
    || [...m.orders.completedKeys].some((k) => k.endsWith(':buy') && m.fills.fillStatusesByKey[k] !== 'filled')
    || Object.entries(m.fills.fillStatusesByKey).some(([k, s]) => k.endsWith(':buy') && s !== 'filled')
    || [...m.fills.noOrderIdKeys].some((k) => k.endsWith(':buy'))
  const tableProps = {
    items: m.plan.displayItems, prices: m.summary.view?.prices ?? {},
    completedKeys: m.orders.completedKeys, unknownKeys: m.orders.unknownKeys,
    onCheck: m.target.setCheckingItem, isMarketOpen: m.market.isOpen, disabledReason: m.market.reason,
    fillStatuses: m.fills.fillStatusesByKey, noOrderIdKeys: m.fills.noOrderIdKeys,
    targetBps, cashTargetBps,
    weightBase: Math.max(0, m.summary.totalAmount - (m.plan.snapshot?.keepAmount ?? 0)),
    cash: m.summary.cashAvailable, cashSettled: m.summary.cashSettled, keepAmount: m.plan.snapshot?.keepAmount ?? 0,
    buyGateOpen: m.gate.gateOpen, buyLimit: m.gate.buyLimit, buyBlockedReason: m.gate.blockedReason,
    fillEventsByKey: m.fills.fillEventsByKey, buyChecking,
    onClearUnknown: (item: { code: string; side: string }) =>
      m.orders.handleClearKey(`${m.target.activeKey}:${item.code}:${item.side}`),
  }
  return (<div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {m.fills.showCheckFailed && (
          <StatusBadge label={rebalanceText.error.fillCheckFailed} tone="bg-amber-50 text-amber-800">
            <AlertCircle aria-hidden="true" className="h-3 w-3" /><span>{rebalanceText.noticeShort.fillFailed}</span>
          </StatusBadge>
        )}
        {m.fills.showNotFoundClosed && (
          <StatusBadge label={rebalanceText.error.notFoundAfterClosed} tone="bg-blue-50 text-blue-700">
            <Search aria-hidden="true" className="h-3 w-3" /><span>{rebalanceText.noticeShort.fillNotFound}</span>
          </StatusBadge>
        )}
        {m.fills.remainingCount > 0 && (
          <span className="text-xs text-stone-500">{rebalanceText.action.remainingFills(m.fills.remainingCount)}</span>
        )}
        {(m.fills.isStreamClosed || m.fills.showCheckFailed || m.fills.showNotFoundClosed) && m.fills.hasDoneOrders && (
          <Button variant="outline" size="sm" onClick={m.fills.reconnect}
            aria-label={rebalanceText.action.recheckFills} className="min-h-9 px-3 text-xs text-stone-600">
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{rebalanceText.action.recheckFillsShort}</span>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => m.target.setIsRefreshOpen(true)}
          className="min-h-9 px-3 text-xs text-stone-600">
          <RotateCcw aria-hidden="true" className="mr-1 h-3.5 w-3.5" />{rebalanceText.action.refreshPlan}
        </Button>
      </div>
      <RebalanceTable {...tableProps} />
      <OpenOrdersPanel target={m.target.currentTarget} onCancelled={m.orders.handleCancelled} />
      {m.target.checkingItem && m.target.currentTarget && (
        <RebalanceConfirmDialog
          item={m.target.checkingItem} accountId={m.target.currentTarget.accountId}
          productCode={m.target.currentTarget.productCode}
          price={m.summary.view?.prices[m.target.checkingItem.code] ?? 0}
          requestId={m.orders.getRequestId(m.target.checkingItem)} onClose={() => m.target.setCheckingItem(null)}
          onStart={m.orders.handleOrderStart} onSuccess={m.orders.handleOrderSuccess}
          onFailure={m.orders.handleOrderFailure} onUnknown={m.orders.handleOrderUnknown}
        />
      )}
      <RebalanceRefreshDialog
        open={!m.plan.blocked && m.target.isRefreshOpen} unconfirmedCount={m.fills.unconfirmedCount}
        onConfirm={() => { m.orders.handleClearDone(); m.target.setIsRefreshOpen(false) }}
        onClose={() => m.target.setIsRefreshOpen(false)}
      />
    </div>
  )
}
