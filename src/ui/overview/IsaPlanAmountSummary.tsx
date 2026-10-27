import { calculateCurrentMonthTargets } from '../../app/accounts/isa-progress-diff'
import { fromProductPlan } from '../../app/accounts/isa-plan'
import { seoulToday } from '../../app/accounts/isa-term'
import type { ProductPlan } from '../../domain/accounts/product-plan'
import { Sensitive } from '../components/Sensitive'
import { StatGrid } from '../components/StatGrid'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'

interface Props { plan?: Partial<ProductPlan>; totalAssets?: number | null; today?: string }

const display = (m: number | null) => (m === null ? isaText.unset : isaText.amount(m))

function TargetVal({ man }: { man: number | null }) {
  if (man === null) return <span>{isaText.noTarget}</span>
  return <span className="inline-flex items-baseline whitespace-nowrap"><Sensitive className={typeScale.number}>{man.toLocaleString('ko-KR')}</Sensitive><span className={`${typeScale.caption} font-normal`}>{isaText.amountUnit}</span></span>
}

function TargetPair({ label, man }: { label: string; man: number | null }) {
  return (
    <div data-testid="month-target-pair" className="flex items-center gap-1.5">
      <span className={typeScale.caption}>{label}</span>
      <TargetVal man={man} />
    </div>
  )
}

export function IsaPlanAmountSummary({ plan, totalAssets, today = seoulToday() }: Props) {
  if (!plan) return null
  const { minTargetAmountManwon, maxTargetAmountManwon } = fromProductPlan(plan)
  const l = plan.minTargetAmountWon ?? (minTargetAmountManwon ? minTargetAmountManwon * 10_000 : null)
  const u = plan.maxTargetAmountWon ?? (maxTargetAmountManwon ? maxTargetAmountManwon * 10_000 : null)
  const month = calculateCurrentMonthTargets(plan.startDate, today, l, u, totalAssets ?? null, isaText.manUnit, isaText.noTarget, isaText.needStartDate, isaText.beforeStart)

  return (
    <div data-testid="isa-amount-summary" className="space-y-3">
      <StatGrid
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        items={[
          { label: <span className={typeScale.label}>{isaText.minTarget}</span>, value: <Sensitive className={typeScale.number}>{display(minTargetAmountManwon)}</Sensitive> },
          { label: <span className={typeScale.label}>{isaText.maxTarget}</span>, value: <Sensitive className={typeScale.number}>{display(maxTargetAmountManwon)}</Sensitive> },
        ]}
      />
      {month ? (
        <div data-testid="isa-month-target-summary" className="space-y-2 rounded border border-primary-100 bg-white p-3">
          <div className="flex flex-col gap-2 min-[769px]:flex-row min-[769px]:items-center min-[769px]:justify-between">
            <span className={typeScale.label}>{isaText.currentMonthTarget}</span>
            <div className={`flex flex-col gap-2 min-[769px]:flex-row min-[769px]:items-center min-[769px]:gap-2 ${typeScale.caption}`}>
              <TargetPair label={isaText.targetMin} man={month.minTargetManwon} />
              <span className="hidden min-[769px]:inline text-stone-300">/</span>
              <TargetPair label={isaText.progressMidLabel} man={month.midTargetManwon} />
              <span className="hidden min-[769px]:inline text-stone-300">/</span>
              <TargetPair label={isaText.targetMax} man={month.maxTargetManwon} />
            </div>
          </div>
          {totalAssets !== null && totalAssets !== undefined ? (
            <div className={`space-y-1 border-t border-primary-50 pt-2 ${typeScale.caption}`}>
              <div className="flex justify-between items-center"><span>{isaText.diffMin}</span><Sensitive className={typeScale.number}>{month.minDiffText}</Sensitive></div>
              <div className="flex justify-between items-center"><span>{isaText.diffMid}</span><Sensitive className={typeScale.number}>{month.midDiffText}</Sensitive></div>
              <div className="flex justify-between items-center"><span>{isaText.diffMax}</span><Sensitive className={typeScale.number}>{month.maxDiffText}</Sensitive></div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
