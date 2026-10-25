import { overviewText as text } from '../glossary/overview'
import { IrpWeightBar, type IrpHolding } from './IrpHoldingRow'

export function IrpHoldingCard({ holding }: { holding: IrpHolding }) {
  return (
    <li className="rounded-lg border border-stone-200 p-4">
      <div className="flex items-center gap-2">
        {holding.code ? <span className="font-mono text-xs text-stone-500">{holding.code}</span> : null}
        <span className="font-medium">{holding.name}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-stone-500">{text.quantity}</dt>
          <dd className="text-right tabular-nums">{text.number(holding.quantity)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">{text.evaluation}</dt>
          <dd className="text-right tabular-nums">{text.won(holding.evaluationAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">{text.profitLoss}</dt>
          <dd className={`text-right tabular-nums ${text.pnlColor(holding.profitLoss)}`}>{text.signedWon(holding.profitLoss)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">{text.profitRate}</dt>
          <dd className={`text-right tabular-nums ${text.pnlColor(holding.profitLossRate)}`}>{text.signedPercent(holding.profitLossRate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">{text.weight}</dt>
          <dd className="text-right tabular-nums"><IrpWeightBar weight={holding.weight} /></dd>
        </div>
      </dl>
    </li>
  )
}
