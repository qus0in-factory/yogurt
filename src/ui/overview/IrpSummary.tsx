import { AlertTriangle } from 'lucide-react'
import { RISK_LIMIT_PERCENT } from '../../app/kis/risk-ratio'
import { overviewText as text } from '../glossary/overview'
import { profitTone } from './profit-tone'

type Summary = { totalEvaluation: number; cash: number; profitLoss: number; purchaseAmount: number }
type Risk = { ratio: number; exceeds: boolean }

export function IrpSummary({ summary, risk }: { summary: Summary; risk?: Risk }) {
  const rate = summary.purchaseAmount === 0 ? 0 : summary.profitLoss / summary.purchaseAmount * 100
  const loss = profitTone(summary.profitLoss)
  const returnTone = profitTone(rate)
  const card = risk?.exceeds
    ? 'rounded-lg border border-red-300 bg-red-50 p-4 text-red-700'
    : 'rounded-lg bg-primary-50 p-4'
  return (
    <div className={card}>
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
      {risk ? <p className="mt-3 text-xs text-stone-500">{text.riskRatio(risk.ratio)}</p> : null}
      {risk?.exceeds ? (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {text.riskExceeded(RISK_LIMIT_PERCENT)}
        </p>
      ) : null}
    </div>
  )
}
