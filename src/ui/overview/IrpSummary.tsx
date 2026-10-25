import { AlertTriangle } from 'lucide-react'
import { RISK_LIMIT_PERCENT } from '../../app/kis/risk-ratio'
import { overviewText as text } from '../glossary/overview'
import { profitTone } from './profit-tone'
import { StatGrid } from '../components/StatGrid'
import { typeScale } from '../styles/type-scale'

type Summary = { totalEvaluation: number; cash: number; profitLoss: number; purchaseAmount: number }
type Risk = { ratio: number; exceeds: boolean }

export function IrpSummary({ summary, risk, showCash = true }: { summary: Summary; risk?: Risk; showCash?: boolean }) {
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
      <StatGrid className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3" items={[
        ...(showCash ? [{ label: <span className={typeScale.label}>{text.cash}</span>, value: <span className={typeScale.number}>{text.won(summary.cash)}</span> }] : []),
        { label: <span className={typeScale.label}>{text.profitLoss}</span>, value: <span className={`${typeScale.number} ${loss.className}`}>{loss.sign}{text.won(Math.abs(summary.profitLoss))}</span> },
        { label: <span className={typeScale.label}>{text.profitRate}</span>, value: <span className={`${typeScale.number} ${returnTone.className}`}>{returnTone.sign}{text.percent(Math.abs(rate))}</span> },
      ]} />
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
