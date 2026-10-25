import { overviewText as text } from '../glossary/overview'
import type { RiskClass } from '../../app/kis/risk-class-client'
import { typeScale } from '../styles/type-scale'
import { RiskToggle } from './RiskToggle'

export type IrpHolding = {
  code: string; name: string; quantity: number; averagePrice: number; purchaseAmount: number
  currentPrice: number; evaluationAmount: number; profitLoss: number; profitLossRate: number; weight: number
}

export function IrpWeightBar({ weight }: { weight: number }) {
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="h-1.5 w-16 rounded bg-primary-100">
        <span data-testid="holding-weight" className="block h-full rounded bg-primary-400" style={{ width: `${weight}%` }} />
      </span>
      <span className="tabular-nums">{text.weightPercent(weight)}</span>
    </span>
  )
}

export function IrpHoldingRow({ holding, riskClass = 'risk', onToggle = () => {}, disabled = false, showRiskToggle = true }: {
  holding: IrpHolding; riskClass?: RiskClass; onToggle?: () => void; disabled?: boolean; showRiskToggle?: boolean
}) {
  const cell = `py-3 pr-4 text-right last:pr-0 ${typeScale.number}`
  return (
    <tr>
      <th scope="row" className={`whitespace-nowrap py-3 pr-4 text-left ${typeScale.body}`}>
        <span className="flex items-center gap-2">
          {holding.code ? <span className="font-mono text-xs text-stone-500">{holding.code}</span> : null}
          <span className="font-medium">{holding.name}</span>
        </span>
      </th>
      <td className={cell}>{text.number(holding.quantity)}</td>
      <td className={cell}>{text.won(holding.evaluationAmount)}</td>
      <td className={cell}><span className={text.pnlColor(holding.profitLoss)}>{text.signedWon(holding.profitLoss)}</span></td>
      <td className={cell}><span className={text.pnlColor(holding.profitLossRate)}>{text.signedPercent(holding.profitLossRate)}</span></td>
      <td className={cell}><IrpWeightBar weight={holding.weight} /></td>
      <td className={cell}>{showRiskToggle && holding.code ? <RiskToggle riskClass={riskClass} onToggle={onToggle} disabled={disabled} /> : null}</td>
    </tr>
  )
}
