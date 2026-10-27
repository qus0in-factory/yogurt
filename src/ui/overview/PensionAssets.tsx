import type { AccountAssets } from '../../app/kis/account-assets-client'
import { classifyAssetRows } from '../../app/kis/asset-classes'
import { overviewText as text } from '../glossary/overview'
import { Sensitive } from '../components/Sensitive'
import { typeScale } from '../styles/type-scale'
import { WeightBar } from '../components/WeightBar'
import { SectionHeading } from '../components/SectionHeading'

export function PensionAssets({ rows, productCode = '22', showStock = true, showCash = true, cashD2 }: {
  rows: AccountAssets['rows']; productCode?: string; showStock?: boolean; showCash?: boolean; cashD2?: number
}) {
  const { items, total } = classifyAssetRows(rows, productCode, cashD2)
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
                <th scope="row" className={`py-3 pr-4 text-left font-medium ${typeScale.body}`}>
                  {row.label ? <><span>{text.assetClass[row.label]}</span>{row.label === 'cash' ? <span className={`ml-1 ${typeScale.caption} text-stone-500`}>{text.dPlus2}</span> : null}</> : text.assetGroup(row.index)}
                </th>
                <td className={`py-3 pr-4 text-right ${typeScale.number}`}><Sensitive>{text.won(row.evaluationAmount)}</Sensitive></td>
                <td className="py-3 pr-4 text-right"><WeightBar weight={row.weight} /></td>
              </tr>
            ))}
            {total ? <tr className="border-t-2 border-stone-300">
              <th scope="row" className={`py-3 pr-4 text-left font-medium ${typeScale.body}`}>{text.assetClass.total}</th>
              <td className={`py-3 pr-4 text-right ${typeScale.number}`}><Sensitive>{text.won(total.evaluationAmount)}</Sensitive></td>
              <td className="py-3 pr-4 text-right"><WeightBar weight={total.weight} /></td>
            </tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
