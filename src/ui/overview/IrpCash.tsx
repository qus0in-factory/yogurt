import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'
import { IrpWeightBar } from './IrpHoldingRow'

const cell = `py-3 pr-4 text-right last:pr-0 ${typeScale.number}`

export function IrpCashRow({ cash, weight, showRiskColumn = true }: { cash: number; weight: number; showRiskColumn?: boolean }) {
  return (
    <tr className="border-t-2 border-stone-200 bg-stone-50">
      <th scope="row" className={`whitespace-nowrap py-3 pr-4 text-left font-medium ${typeScale.body}`}>{text.cashRow}</th>
      <td className={cell} />
      <td className={cell}>{text.won(cash)}</td>
      <td className={cell} />
      <td className={cell} />
      <td className={cell}><IrpWeightBar weight={weight} /></td>
      {showRiskColumn ? <td className={cell} /> : null}
    </tr>
  )
}

export function IrpCashCard({ cash, weight }: { cash: number; weight: number }) {
  return (
    <li className="rounded-lg border border-stone-200 border-t-2 bg-stone-50 p-4">
      <p className={`font-medium ${typeScale.body}`}>{text.cashRow}</p>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <dt className={typeScale.label}>{text.evaluation}</dt>
          <dd className={`text-right ${typeScale.number}`}>{text.won(cash)}</dd>
        </div>
        <div>
          <dt className={typeScale.label}>{text.weight}</dt>
          <dd className={`text-right ${typeScale.number}`}><IrpWeightBar weight={weight} /></dd>
        </div>
      </dl>
    </li>
  )
}
