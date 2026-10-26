import type { ReactElement } from 'react'
import { overviewText as text } from '../glossary/overview'
import { Sensitive } from '../components/Sensitive'
import { typeScale } from '../styles/type-scale'
import { WeightBar } from '../components/WeightBar'
import { holdingColumns, type HoldingColumnId } from './holding-columns'

export function IrpCashRow({ cash, weight, showRiskColumn = true }: { cash: number; weight: number; showRiskColumn?: boolean }) {
  const cell = `py-3 pr-4 text-right ${typeScale.number}`
  const cells: Record<HoldingColumnId, ReactElement> = {
    name: <th key="name" scope="row" className={`whitespace-nowrap py-3 pr-4 text-left font-medium ${typeScale.body}`}>{text.cashRow}</th>,
    quantity: <td key="quantity" className={cell} />,
    evaluation: <td key="evaluation" className={cell}><Sensitive>{text.won(cash)}</Sensitive></td>,
    profitLoss: <td key="profitLoss" className={cell} />,
    profitRate: <td key="profitRate" className={cell} />,
    weight: <td key="weight" className={cell}><WeightBar weight={weight} /></td>,
    risk: <td key="risk" className={cell} />,
  }
  return <tr className="border-t-2 border-stone-200 bg-stone-50">{holdingColumns(showRiskColumn).map(({ id }) => cells[id])}</tr>
}

export function IrpCashCard({ cash, weight }: { cash: number; weight: number }) {
  return (
    <li className="rounded-lg border border-stone-200 border-t-2 bg-stone-50 p-4">
      <p className={`font-medium ${typeScale.body}`}>{text.cashRow}</p>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div className="min-w-0"><dt className={typeScale.label}>{text.evaluation}</dt><dd className={`text-right ${typeScale.number}`}><Sensitive>{text.won(cash)}</Sensitive></dd></div>
        <div className="min-w-0"><dt className={typeScale.label}>{text.weight}</dt><dd className="min-w-0"><WeightBar weight={weight} /></dd></div>
      </dl>
    </li>
  )
}
