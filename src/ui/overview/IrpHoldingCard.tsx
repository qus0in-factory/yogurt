import { overviewText as text } from '../glossary/overview'
import type { RiskClass } from '../../app/kis/risk-class-client'
import { Sensitive } from '../components/Sensitive'
import { typeScale } from '../styles/type-scale'
import { RiskToggle } from './RiskToggle'
import { WeightBar } from '../components/WeightBar'
import type { IrpHolding } from './IrpHoldingRow'

export function IrpHoldingCard({ holding, riskClass = 'risk', onToggle = () => {}, disabled = false, showRiskToggle = true }: {
  holding: IrpHolding; riskClass?: RiskClass; onToggle?: () => void; disabled?: boolean; showRiskToggle?: boolean
}) {
  return (
    <li className="rounded-lg border border-stone-200 p-4 max-[768px]:p-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {holding.code ? <span className="font-mono text-xs text-stone-500">{holding.code}</span> : null}
          <span className={`min-w-0 break-words font-medium ${typeScale.body}`}>{holding.name}</span>
        </span>
        {showRiskToggle && holding.code ? <RiskToggle riskClass={riskClass} onToggle={onToggle} disabled={disabled} /> : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-4 max-[768px]:mt-2 max-[768px]:gap-3 max-[375px]:gap-2">
        <div className="min-w-0">
          <dt className={typeScale.label}>{text.quantity}</dt>
          <dd className={`text-right ${typeScale.number}`}><Sensitive className={`text-right ${typeScale.number}`}>{text.number(holding.quantity)}</Sensitive></dd>
        </div>
        <div className="min-w-0">
          <dt className={typeScale.label}>{text.evaluation}</dt>
          <dd className={`text-right ${typeScale.number}`}><Sensitive className={`text-right ${typeScale.number}`}>{text.won(holding.evaluationAmount)}</Sensitive></dd>
        </div>
        <div className="min-w-0">
          <dt className={typeScale.label}>{text.profitLoss}</dt>
          <dd className={`text-right ${typeScale.number}`}><Sensitive className={`tabular-nums ${text.pnlColor(holding.profitLoss)}`}>{text.signedWon(holding.profitLoss)}</Sensitive></dd>
        </div>
        <div className="min-w-0">
          <dt className={typeScale.label}>{text.profitRate}</dt>
          <dd className={`text-right ${typeScale.number}`}><span className={`tabular-nums ${text.pnlColor(holding.profitLossRate)}`}>{text.signedPercent(holding.profitLossRate)}</span></dd>
        </div>
        <div className="min-w-0">
          <dt className={typeScale.label}>{text.weight}</dt>
          <dd className={`min-w-0 text-right ${typeScale.number}`}><WeightBar weight={holding.weight} /></dd>
        </div>
      </dl>
    </li>
  )
}
