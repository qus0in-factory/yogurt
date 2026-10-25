import type { ReactElement } from 'react'
import { overviewText as text } from '../glossary/overview'
import type { RiskClass } from '../../app/kis/risk-class-client'
import { typeScale } from '../styles/type-scale'
import { WeightBar } from '../components/WeightBar'
import { RiskToggle } from './RiskToggle'
import { holdingColumns, type HoldingColumnId } from './holding-columns'

export type IrpHolding = {
  code: string; name: string; quantity: number; averagePrice: number; purchaseAmount: number
  currentPrice: number; evaluationAmount: number; profitLoss: number; profitLossRate: number; weight: number
}

export function IrpHoldingRow({ holding, riskClass = 'risk', onToggle = () => {}, disabled = false, showRiskToggle = true }: {
  holding: IrpHolding; riskClass?: RiskClass; onToggle?: () => void; disabled?: boolean; showRiskToggle?: boolean
}) {
  const cell = `py-3 pr-4 text-right ${typeScale.number}`
  const cells: Record<HoldingColumnId, ReactElement> = {
    name: <th key="name" scope="row" className={`whitespace-nowrap py-3 pr-4 text-left ${typeScale.body}`}>
      <span className="flex items-center gap-2">{holding.code ? <span className="font-mono text-xs text-stone-500">{holding.code}</span> : null}<span className="font-medium">{holding.name}</span></span>
    </th>,
    quantity: <td key="quantity" className={cell}>{text.number(holding.quantity)}</td>,
    evaluation: <td key="evaluation" className={cell}>{text.won(holding.evaluationAmount)}</td>,
    profitLoss: <td key="profitLoss" className={cell}><span className={text.pnlColor(holding.profitLoss)}>{text.signedWon(holding.profitLoss)}</span></td>,
    profitRate: <td key="profitRate" className={cell}><span className={text.pnlColor(holding.profitLossRate)}>{text.signedPercent(holding.profitLossRate)}</span></td>,
    weight: <td key="weight" className={cell}><WeightBar weight={holding.weight} /></td>,
    risk: <td key="risk" className={cell}>{holding.code ? <RiskToggle riskClass={riskClass} onToggle={onToggle} disabled={disabled} /> : null}</td>,
  }
  return <tr>{holdingColumns(showRiskToggle).map(({ id }) => cells[id])}</tr>
}
