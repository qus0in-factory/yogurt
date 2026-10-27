import { RefreshCw, Scale } from 'lucide-react'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'
import { RebalanceAccountSelect } from './RebalanceAccountSelect'
import { RebalanceIsaTargets } from './RebalanceIsaTargets'
import { RebalanceMarketNotice } from './RebalanceMarketNotice'
import { RebalancePriceWarning } from './RebalancePriceWarning'
import { RebalanceSummary } from './RebalanceSummary'
import { KeepAmountField } from './KeepAmountField'
import { RebalanceBlockNotice } from './RebalanceBlockNotice'
import { StatusBadge } from './RebalanceFillChip'
import { RebalancePlanPanel } from './RebalancePlanPanel'
import { useRebalanceSectionModel } from './useRebalanceSectionModel'
export function RebalanceSection() {
  const m = useRebalanceSectionModel()
  if (m.target.options.length === 0) {
    return (
      <EmptyState icon={Scale} title={rebalanceText.noConnectedPortfolio}
        description={rebalanceText.noAccounts} className="mt-3" />
    )
  }
  const view = m.summary.view
  const calculatedTime = m.plan.calculatedAt
    ? new Date(m.plan.calculatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null
  return (
    <div className="flex flex-col gap-4">
      <p className={typeScale.body}>{rebalanceText.description}</p>
      <RebalanceAccountSelect
        options={m.target.options}
        selectedKey={m.target.activeKey}
        onSelectKey={m.target.setSelectedKey}
      />
      <KeepAmountField
        key={m.target.activeKey}
        savedAmount={m.keep.keepAmount}
        onSave={m.keep.saveKeepAmount}
        isSaving={m.keep.isSaving}
        isError={m.keep.isError}
        isLoading={m.keep.isLoading}
      />
      <RebalancePriceWarning inputs={m.inputs.data} />
      {m.plan.blocked ? <RebalanceBlockNotice reason={m.plan.blocked} /> : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {calculatedTime ? (
          <span className={typeScale.caption}>{rebalanceText.calculatedAt(calculatedTime)}</span>
        ) : null}
        {m.plan.isStale ? (
          <StatusBadge label={rebalanceText.planRefreshed} tone="bg-stone-100 text-stone-700">
            <RefreshCw aria-hidden="true" className="h-3 w-3" />
            <span>{rebalanceText.planRefreshedShort}</span>
          </StatusBadge>
        ) : null}
        <Button
          variant="outline" size="sm" onClick={m.recalc.recalcNow}
          disabled={!m.plan.canRecalc || m.plan.blocked !== null || m.recalc.isRecalculating
            || m.inputs.isFetching || m.keep.isKeepFetching}
          className="min-h-9 px-3 text-xs text-stone-600"
        >
          {rebalanceText.recalcPlan}
        </Button>
      </div>
      {view ? (
        <RebalanceSummary
          holdings={view.holdings} cashAvailable={m.summary.cashAvailable}
          cashSettled={m.summary.cashSettled} keepAmount={m.plan.snapshot?.keepAmount ?? 0}
          items={m.plan.displayItems} prices={view.prices}
        />
      ) : null}
      {view && m.summary.isIsa ? (
        <RebalanceIsaTargets totalAmount={m.summary.totalAmount} plan={m.summary.isaPlan} />
      ) : null}
      <RebalanceMarketNotice status={m.market.status} isError={m.market.isError} />
      <RebalancePlanPanel model={m} />
    </div>
  )
}
