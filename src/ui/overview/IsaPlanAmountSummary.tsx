import { calculateCurrentMonthTargets } from '../../app/accounts/isa-progress-diff'
import { fromProductPlan } from '../../app/accounts/isa-plan'
import { seoulToday } from '../../app/accounts/isa-term'
import type { ProductPlan } from '../../domain/accounts/product-plan'
import { StatGrid } from '../components/StatGrid'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'

interface Props {
  plan?: Partial<ProductPlan>
  totalAssets?: number | null
  today?: string
}

function display(manwon: number | null): string {
  return manwon === null ? isaText.unset : isaText.amount(manwon)
}

export function IsaPlanAmountSummary({ plan, totalAssets, today = seoulToday() }: Props) {
  if (!plan) return null
  const { minTargetAmountManwon, maxTargetAmountManwon } = fromProductPlan(plan)
  const l = plan.minTargetAmountWon ?? (minTargetAmountManwon ? minTargetAmountManwon * 10_000 : null)
  const u = plan.maxTargetAmountWon ?? (maxTargetAmountManwon ? maxTargetAmountManwon * 10_000 : null)
  const month = calculateCurrentMonthTargets(
    plan.startDate,
    today,
    l,
    u,
    totalAssets ?? null,
    isaText.manUnit,
    isaText.noTarget,
    isaText.needStartDate,
    isaText.beforeStart,
  )
  const fmt = (man: number | null) => (man !== null ? isaText.amount(man) : isaText.noTarget)

  return (
    <div data-testid="isa-amount-summary" className="space-y-3">
      <StatGrid
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        items={[
          { label: <span className={typeScale.label}>{isaText.minTarget}</span>, value: <span className={typeScale.number}>{display(minTargetAmountManwon)}</span> },
          { label: <span className={typeScale.label}>{isaText.maxTarget}</span>, value: <span className={typeScale.number}>{display(maxTargetAmountManwon)}</span> },
        ]}
      />
      {month ? (
        <div data-testid="isa-month-target-summary" className="space-y-2 rounded border border-primary-100 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className={typeScale.label}>{isaText.currentMonthTarget}</span>
            <div className={`flex items-center gap-2 ${typeScale.caption}`}>
              <span>{fmt(month.minTargetManwon)}</span>
              <span>/</span>
              <span>{fmt(month.midTargetManwon)}</span>
              <span>/</span>
              <span>{fmt(month.maxTargetManwon)}</span>
            </div>
          </div>
          {totalAssets !== null && totalAssets !== undefined ? (
            <div className={`space-y-1 border-t border-primary-50 pt-2 ${typeScale.caption}`}>
              <div className="flex justify-between"><span>{isaText.diffMin}</span><span className="font-semibold">{month.minDiffText}</span></div>
              <div className="flex justify-between"><span>{isaText.diffMid}</span><span className="font-semibold">{month.midDiffText}</span></div>
              <div className="flex justify-between"><span>{isaText.diffMax}</span><span className="font-semibold">{month.maxDiffText}</span></div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
