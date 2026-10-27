import { TriangleAlert } from 'lucide-react'
import type { RebalanceInputs } from '../../../app/rebalance/types'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = { inputs?: Pick<RebalanceInputs, 'priceFailed' | 'targets' | 'holdings'> }

export function RebalancePriceWarning({ inputs }: Props) {
  const failed = inputs?.priceFailed ?? []
  if (!failed.length) return null
  const labels = [...new Set(failed)].map(code => {
    const name = inputs?.targets.find(item => item.code === code)?.name
      || inputs?.holdings.find(item => item.code === code)?.name
    return name && name !== code ? rebalanceText.failedPriceStock(name, code) : code
  })
  return (
    <p role="status" className={`${typeScale.caption} flex items-start gap-2 text-amber-800`}>
      <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 break-words">{rebalanceText.priceFailed(labels.join(', '))}</span>
    </p>
  )
}
