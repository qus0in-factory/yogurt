import { useState } from 'react'
import { calculateCurrentMonthTargets } from '../../../app/accounts/isa-progress-diff'
import { seoulToday } from '../../../app/accounts/isa-term'
import { isaText } from '../../glossary/isa'
import { ChevronDown, Target } from 'lucide-react'
import { Sensitive } from '../../components/Sensitive'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type TargetPlan = { startDate?: string; minTargetAmountWon: number | null; maxTargetAmountWon: number | null } | null | undefined
type Props = { totalAmount: number; plan?: TargetPlan }

export function RebalanceIsaTargets({ totalAmount, plan }: Props) {
  const [open, setOpen] = useState(false)
  const t = rebalanceText.isaTargets
  const month = calculateCurrentMonthTargets(
    plan?.startDate, seoulToday(), plan?.minTargetAmountWon ?? null, plan?.maxTargetAmountWon ?? null,
    totalAmount, isaText.manUnit, isaText.noTarget, isaText.needStartDate, isaText.beforeStart,
  )
  const rows = [
    { label: t.min, target: month.minTargetManwon, diff: month.minDiffText },
    { label: t.mid, target: month.midTargetManwon, diff: month.midDiffText },
    { label: t.max, target: month.maxTargetManwon, diff: month.maxDiffText },
  ]
  const hasMonth = month.k > 0 && rows.some(row => row.target !== null)

  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="isa-targets-panel"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-11 w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-stone-700 hover:bg-stone-50"
      >
        <span className="flex items-center gap-2">
          <Target aria-hidden="true" className="h-4 w-4 text-stone-500" />
          {t.toggle}
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div id="isa-targets-panel" className="border-t border-stone-100 p-4">
          {!hasMonth ? (
            <p className={typeScale.body}>{t.notSet}</p>
          ) : (
            <div className="flex flex-col divide-y divide-stone-100">
              {rows.map(({ label, target, diff }) => {
                const rate = target !== null && target > 0
                  ? `${((totalAmount / (target * 10_000)) * 100).toFixed(1)}%` : isaText.noTarget
                return (
                  <div key={label} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-700">{label}</span>
                      <span className="text-xs text-stone-400">
                        ({t.targetAmount} {target === null ? isaText.noTarget : <Sensitive>{isaText.amount(target)}</Sensitive>})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="tabular-nums text-stone-700">
                        {target === null ? diff : <Sensitive>{diff}</Sensitive>}
                      </span>
                      <span className="text-stone-300">|</span>
                      <span className="font-semibold tabular-nums text-stone-900">{rate}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
