import { overviewText as text } from '../glossary/overview'
import type { RiskClass } from '../../app/kis/risk-class-client'
import { typeScale } from '../styles/type-scale'
import { RiskToggle } from './RiskToggle'
import { WeightBar } from '../components/WeightBar'
import type { IrpHolding } from './IrpHoldingRow'

export function IrpHoldingCard({ holding, riskClass = 'risk', onToggle = () => {}, disabled = false, showRiskToggle = true }: {
  holding: IrpHolding; riskClass?: RiskClass; onToggle?: () => void; disabled?: boolean; showRiskToggle?: boolean
}) {
  return (
    <li className="rounded-lg border border-stone-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          {holding.code ? <span className="font-mono text-xs text-stone-500">{holding.code}</span> : null}
          <span className={`font-medium ${typeScale.body}`}>{holding.name}</span>
        </span>
        {showRiskToggle && holding.code ? <RiskToggle riskClass={riskClass} onToggle={onToggle} disabled={disabled} /> : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <dt className={typeScale.label}>{text.quantity}</dt>
          <dd className={`text-right ${typeScale.number}`}>{text.number(holding.quantity)}</dd>
        </div>
        <div>
          <dt className={typeScale.label}>{text.evaluation}</dt>
          <dd className={`text-right ${typeScale.number}`}>{text.won(holding.evaluationAmount)}</dd>
        </div>
        <div>
          <dt className={typeScale.label}>{text.profitLoss}</dt>
          <dd className={`text-right ${typeScale.number}`}><span className={`tabular-nums ${text.pnlColor(holding.profitLoss)}`}>{text.signedWon(holding.profitLoss)}</span></dd>
        </div>
        <div>
          <dt className={typeScale.label}>{text.profitRate}</dt>
          <dd className={`text-right ${typeScale.number}`}><span className={`tabular-nums ${text.pnlColor(holding.profitLossRate)}`}>{text.signedPercent(holding.profitLossRate)}</span></dd>
        </div>
        <div>
          <dt className={typeScale.label}>{text.weight}</dt>
          <dd className={`text-right ${typeScale.number}`}><WeightBar weight={holding.weight} /></dd>
        </div>
      </dl>
    </li>
  )
}
