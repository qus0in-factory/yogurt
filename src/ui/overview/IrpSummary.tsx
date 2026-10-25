import { overviewText as text } from '../glossary/overview'
import { profitTone } from './profit-tone'

type Summary = { totalEvaluation: number; cash: number; profitLoss: number; purchaseAmount: number }

export function IrpSummary({ summary }: { summary: Summary }) {
  const rate = summary.purchaseAmount === 0 ? 0 : summary.profitLoss / summary.purchaseAmount * 100
  const loss = profitTone(summary.profitLoss)
  const returnTone = profitTone(rate)
  return (
    <div className="rounded-lg bg-primary-50 p-4">
      <p className="text-xs text-stone-500">{text.totalEvaluation}</p>
      <p className="text-2xl font-semibold text-stone-900">{text.won(summary.totalEvaluation)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <dt className="text-xs text-stone-500">{text.cash}</dt>
          <dd className="tabular-nums">{text.won(summary.cash)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">{text.profitLoss}</dt>
          <dd className={`tabular-nums ${loss.className}`}>{loss.sign}{text.won(Math.abs(summary.profitLoss))}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">{text.profitRate}</dt>
          <dd className={`tabular-nums ${returnTone.className}`}>{returnTone.sign}{text.percent(Math.abs(rate))}</dd>
        </div>
      </dl>
    </div>
  )
}
