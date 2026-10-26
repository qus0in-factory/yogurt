import { BellRing } from 'lucide-react'
import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'

export function PensionLoanNotice({ excess, requiredCollateral }: { excess: number; requiredCollateral: number }) {
  return (
    <div role="status" className={`mt-3 flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 ${typeScale.body}`}>
      <BellRing className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{text.withdrawableNotice(text.won(excess))}</p>
        <p className={`mt-1 ${typeScale.caption}`}>{text.withdrawableDetail(text.manwon(requiredCollateral))}</p>
      </div>
    </div>
  )
}
