import type { PathPoint } from '../../app/accounts/isa-progress-path'
import { isaText } from '../glossary/isa'
import { typeScale } from '../styles/type-scale'

interface Props {
  points: PathPoint[]
  hasMid: boolean
}

export function IsaProgressTable({ points, hasMid }: Props) {
  const toManwon = (val: number | null) => (val !== null ? isaText.amount(Math.round(val / 10_000)) : '-')

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
          <tbody className={typeScale.caption}>
            {points.map((pt) => (
              <tr key={pt.month} className="border-t border-primary-50">
                <td className="p-2">{pt.month.replace('-', '.')}</td>
                <td className="p-2">{toManwon(pt.min)}</td>
                {hasMid ? <td className="p-2">{toManwon(pt.mid)}</td> : null}
                <td className="p-2">{toManwon(pt.max)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
