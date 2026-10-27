import { useMemo, useState } from 'react'
import { Scale } from 'lucide-react'
import { buildRebalancePlan } from '../../../domain/rebalance/plan'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { useRebalanceInputs, useTargetAccounts } from '../../../app/rebalance/useRebalanceInputs'
import { useAccounts } from '../../accounts/useAccounts'
import { EmptyState } from '../../components/EmptyState'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'
import { RebalanceAccountSelect } from './RebalanceAccountSelect'
import { RebalanceConfirmDialog } from './RebalanceConfirmDialog'
import { RebalanceIsaTargets } from './RebalanceIsaTargets'
import { RebalancePriceWarning } from './RebalancePriceWarning'
import { RebalanceSummary } from './RebalanceSummary'
import { RebalanceTable } from './RebalanceTable'

export function RebalanceSection() {
  const options = useTargetAccounts()
  const { data: accounts } = useAccounts()
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [keepAmount, setKeepAmount] = useState(0)
  const [checkingItem, setCheckingItem] = useState<RebalanceItem | null>(null)
  const [completedCodes, setCompletedCodes] = useState<Set<string>>(() => new Set())

  const activeKey = selectedKey || (options[0] ? `${options[0].accountId}:${options[0].productCode}` : '')
  const currentTarget = options.find((opt) => `${opt.accountId}:${opt.productCode}` === activeKey) ?? null
  const { data: inputs, isLoading } = useRebalanceInputs(currentTarget)
  const isIsa = currentTarget?.productCode === '01'
  const isaPlan = isIsa ? accounts?.find((a) => a.id === currentTarget?.accountId)?.productPlans?.['01'] : null
  const totalAmount = inputs ? inputs.holdings.reduce((s, h) => s + h.evaluationAmount, 0) + inputs.cash : 0

  const { plan, displayItems } = useMemo(() => {
    if (!inputs || inputs.targets.length === 0) return { plan: null, displayItems: [] }
    const p = buildRebalancePlan({ ...inputs, keepAmount })
    const warned: RebalanceItem[] = p.warnings.filter((w) => w.code && w.reason === 'NO_PRICE').map((w) => {
      const t = inputs.targets.find((x) => x.code === w.code)
      return { code: w.code!, name: t?.name ?? w.code!, targetQuantity: 0, currentQuantity: 0, orderQuantity: 0, side: 'buy' }
    })
    return { plan: p, displayItems: [...p.items, ...warned] }
  }, [inputs, keepAmount])

  if (options.length === 0) {
    return <EmptyState icon={Scale} title={rebalanceText.noConnectedPortfolio} description={rebalanceText.noAccounts} className="mt-3" />
  }

  return (
    <div className="flex flex-col gap-4">
      <p className={typeScale.body}>{rebalanceText.description}</p>
      <RebalanceAccountSelect
        options={options} selectedKey={activeKey} keepAmount={keepAmount}
        onSelectKey={(k) => { setSelectedKey(k); setCompletedCodes(new Set()) }}
        onChangeKeepAmount={setKeepAmount}
      />
      <RebalancePriceWarning inputs={inputs} />
      {inputs ? (
        <RebalanceSummary
          holdings={inputs.holdings} cash={inputs.cash} keepAmount={keepAmount}
          items={displayItems} prices={inputs.prices}
        />
      ) : null}
      {inputs && isIsa ? <RebalanceIsaTargets totalAmount={totalAmount} plan={isaPlan} /> : null}
      {isLoading ? (
        <p role="status" className={typeScale.body}>{rebalanceText.action.checking}</p>
      ) : plan ? (
        <RebalanceTable
          items={displayItems} prices={inputs?.prices ?? {}}
          completedCodes={completedCodes} onCheck={setCheckingItem}
        />
      ) : null}
      {checkingItem && currentTarget ? (
        <RebalanceConfirmDialog
          item={checkingItem} accountId={currentTarget.accountId}
          productCode={currentTarget.productCode} price={inputs?.prices[checkingItem.code] ?? 0}
          onClose={() => setCheckingItem(null)}
          onSuccess={(code) => setCompletedCodes((prev) => new Set(prev).add(code))}
        />
      ) : null}
    </div>
  )
}
