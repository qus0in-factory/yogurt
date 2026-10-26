import type { PathPoint } from '../../app/accounts/isa-progress-path'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'

interface Props { points: PathPoint[]; hasMid: boolean }

function AmountCell({ val }: { val: number | null }) {
  if (val === null) return <td className={`p-2 ${typeScale.caption}`}>-</td>
  const man = Math.round(val / 10_000).toLocaleString('ko-KR')
  return (
    <td className="p-2">
      <span className={typeScale.number}>{man}<span className={`${typeScale.caption} font-normal`}>{isaText.amountUnit}</span></span>
    </td>
  )
}

export function IsaProgressTable({ points, hasMid }: Props) {
  return (
    <details className="mt-2 text-primary-600">
      <summary className={`cursor-pointer ${typeScale.caption}`}>{isaText.progressTableToggle}</summary>
      <div className="mt-2 max-h-48 overflow-auto border border-primary-100 rounded">
        <table className="w-full text-left">
          <thead className={`bg-primary-50 ${typeScale.label}`}>
            <tr>
              <th className="p-2">{isaText.monthUnit}</th>
              <th className="p-2">{isaText.minTarget}</th>
              {hasMid ? <th className="p-2">{isaText.progressMidLabel}</th> : null}
              <th className="p-2">{isaText.maxTarget}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((pt) => (
              <tr key={pt.month} className="border-t border-primary-50">
                <td className={`p-2 ${typeScale.caption}`}>{pt.month.replace('-', '.')}</td>
                <AmountCell val={pt.min} />
                {hasMid ? <AmountCell val={pt.mid} /> : null}
                <AmountCell val={pt.max} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
