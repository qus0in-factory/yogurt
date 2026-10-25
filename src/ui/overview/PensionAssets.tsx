import type { AccountAssets } from '../../app/kis/account-assets-client'
import { classifyAssetRows } from '../../app/kis/asset-classes'
import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'
import { WeightBar } from '../components/WeightBar'
import { SectionHeading } from '../components/SectionHeading'

export function PensionAssets({ rows, productCode = '22', showStock = true, showCash = true }: {
  rows: AccountAssets['rows']; productCode?: string; showStock?: boolean; showCash?: boolean
}) {
  const { items, total } = classifyAssetRows(rows, productCode)
  const visible = items.filter((row) => (showStock || row.label !== 'stock') && (showCash || row.label !== 'cash'))
  return (
    <section aria-label={text.assetGroups}>
      <SectionHeading>{text.assetGroups}</SectionHeading>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 text-left`}>{text.assetGroupColumn}</th>
            <th scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 text-right`}>{text.evaluation}</th>
            <th scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 text-right`}>{text.weight}</th>
          </tr></thead>
          <tbody className="divide-y divide-stone-100">
            {visible.map((row) => (
              <tr key={row.index}>
                <th scope="row" className={`py-3 pr-4 text-left font-medium ${typeScale.body}`}>{row.label ? text.assetClass[row.label] : text.assetGroup(row.index)}</th>
                <td className={`py-3 pr-4 text-right ${typeScale.number}`}>{text.won(row.evaluationAmount)}</td>
                <td className="py-3 pr-4 text-right"><WeightBar weight={row.weight} /></td>
              </tr>
            ))}
            {total ? <tr className="border-t-2 border-stone-300">
              <th scope="row" className={`py-3 pr-4 text-left font-medium ${typeScale.body}`}>{text.assetClass.total}</th>
              <td className={`py-3 pr-4 text-right ${typeScale.number}`}>{text.won(total.evaluationAmount)}</td>
              <td className="py-3 pr-4 text-right"><WeightBar weight={total.weight} /></td>
            </tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
