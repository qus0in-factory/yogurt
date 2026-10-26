import { isaYear, seoulToday } from '../../../app/accounts/isa-term'
import { isaText } from '../../glossary/isa'
import { portfolioListText } from '../../glossary/portfolio-list'
import { typeScale } from '../../styles/type-scale'

type Props = { productCode: '01' | '22'; startDate?: string }

export function PortfolioAssignmentProduct({ productCode, startDate }: Props) {
  const year = productCode === '01' && startDate ? isaYear(startDate, seoulToday()) : null
  const reference = year === 'beforeStart' ? isaText.beforeStart : year === null ? null : isaText.year(year)
  return (
    <span className="inline-block max-w-full break-words">
      {portfolioListText.productNames[productCode]}
      {reference ? <span className={`${typeScale.caption} text-stone-500`}> {portfolioListText.yearReference(reference)}</span> : null}
    </span>
  )
}
