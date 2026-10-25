import type { AccountAssets } from '../../app/kis/account-assets-client'
import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'

export function PensionAssets({ rows }: { rows: AccountAssets['rows'] }) {
  const filled = rows.filter((row) => [
    row.purchaseAmount, row.evaluationAmount, row.profitLoss, row.creditLoan, row.netAssets, row.weight,
  ].some((value) => value !== 0))
  return (
    <section aria-label={text.fundSection}>
      <h3 className={typeScale.cardTitle}>{text.fundSection}</h3>
      <p className={`mb-3 mt-1 ${typeScale.label}`}>{text.assetGroups}</p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 text-left`}>{text.assetGroupColumn}</th>
            <th scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 text-right`}>{text.evaluation}</th>
            <th scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 text-right`}>{text.weight}</th>
          </tr></thead>
          <tbody className="divide-y divide-stone-100">
            {filled.sort((a, b) => a.index - b.index).map((row, position) => (
              <tr key={row.index}>
                <th scope="row" className={`py-3 pr-4 text-left font-medium ${typeScale.body}`}>{text.assetGroup(position)}</th>
                <td className={`py-3 pr-4 text-right ${typeScale.number}`}>{text.won(row.evaluationAmount)}</td>
                <td className={`py-3 text-right ${typeScale.number}`}>{text.weightPercent(row.weight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
