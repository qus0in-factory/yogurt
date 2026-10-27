import type { ReactElement } from 'react'
import { overviewText as text } from '../glossary/overview'
import { Sensitive } from '../components/Sensitive'
import { typeScale } from '../styles/type-scale'
import { WeightBar } from '../components/WeightBar'
import { holdingColumns, type HoldingColumnId } from './holding-columns'

const cashSubtext = (cashAvailable?: number) => cashAvailable === undefined ? null
  : <span className={`mt-1 block ${typeScale.caption} font-normal text-stone-500`}><Sensitive>{text.cashAvailableValue(text.won(cashAvailable))}</Sensitive></span>

export function IrpCashRow({ cash, cashAvailable, weight, showRiskColumn = true }: { cash: number; cashAvailable?: number; weight: number; showRiskColumn?: boolean }) {
  const cell = `py-3 pr-4 text-right ${typeScale.number}`
  const cells: Record<HoldingColumnId, ReactElement> = {
    name: <th key="name" scope="row" className={`whitespace-nowrap py-3 pr-4 text-left font-medium ${typeScale.body}`}><span>{text.cashRow}</span><span className={`ml-1 ${typeScale.caption} text-stone-500`}>{text.dPlus2}</span>{cashSubtext(cashAvailable)}</th>,
    quantity: <td key="quantity" className={cell} />,
    evaluation: <td key="evaluation" className={cell}><Sensitive>{text.won(cash)}</Sensitive></td>,
    profitLoss: <td key="profitLoss" className={cell} />,
    profitRate: <td key="profitRate" className={cell} />,
    weight: <td key="weight" className={cell}><WeightBar weight={weight} /></td>,
    risk: <td key="risk" className={cell} />,
  }
  return <tr className="border-t-2 border-stone-200 bg-stone-50">{holdingColumns(showRiskColumn).map(({ id }) => cells[id])}</tr>
}

export function IrpCashCard({ cash, cashAvailable, weight }: { cash: number; cashAvailable?: number; weight: number }) {
  return (
    <li className="rounded-lg border border-stone-200 border-t-2 bg-stone-50 p-4">
      <p className={`font-medium ${typeScale.body}`}><span>{text.cashRow}</span><span className={`ml-1 ${typeScale.caption} text-stone-500`}>{text.dPlus2}</span></p>
      {cashSubtext(cashAvailable)}
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div className="min-w-0"><dt className={typeScale.label}>{text.evaluation}</dt><dd className={`text-right ${typeScale.number}`}><Sensitive>{text.won(cash)}</Sensitive></dd></div>
        <div className="min-w-0"><dt className={typeScale.label}>{text.weight}</dt><dd className="min-w-0"><WeightBar weight={weight} /></dd></div>
      </dl>
    </li>
  )
}
