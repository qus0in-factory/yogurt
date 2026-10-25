import { COLLATERAL_MIN_PERCENT, MAX_LOAN_KRW, NEW_LOAN_MAX_PERCENT, loanRatios, requiredCollateral, withdrawableExcess } from '../../app/kis/loan-ratios'
import { InfoTooltip } from '../components/InfoTooltip'
import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'
import { PensionLoanNotice } from './PensionLoanNotice'

export function PensionLoan({ loanAmount, collateralAmount }: { loanAmount: number; collateralAmount: number }) {
  const ratios = loanRatios({ loanAmount, collateralAmount })
  const help = text.maxLoanTooltip(text.manwon(MAX_LOAN_KRW), NEW_LOAN_MAX_PERCENT, text.manwon(requiredCollateral))
  const excess = withdrawableExcess(collateralAmount)
  const notice = excess > 0 ? <PensionLoanNotice excess={excess} requiredCollateral={requiredCollateral} /> : null
  if (loanAmount === 0) {
    return (
      <section aria-label={text.loanStatus}>
        <h3 className={typeScale.cardTitle}>{text.loanStatus}</h3>
        {notice}
        <div className="mt-3 flex items-center gap-1">
          <span className={typeScale.label}>{text.loanAmount}</span>
          <InfoTooltip label={text.loanAmountTooltipLabel}>{help}</InfoTooltip>
        </div>
        <p className={`mt-1 ${typeScale.number}`}>{text.won(0)}</p>
        <p className={`mt-1 ${typeScale.body}`}>{text.noLoan}</p>
        <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">{text.newLoanAvailable}</p>
      </section>
    )
  }
  const collateralClass = ratios.collateralOk ? 'text-emerald-600' : 'text-red-600'
  return (
    <section aria-label={text.loanStatus}>
      <h3 className={typeScale.cardTitle}>{text.loanStatus}</h3>
      {notice}
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <dt className={`flex items-center gap-1 ${typeScale.label}`}>
            {text.loanAmount}
            <InfoTooltip label={text.loanAmountTooltipLabel}>{help}</InfoTooltip>
          </dt>
          <dd className={typeScale.number}>{text.won(loanAmount)}</dd>
        </div>
        <div>
          <dt className={`flex items-center gap-1 ${typeScale.label}`}>
            {text.collateralRatio}
            <InfoTooltip label={text.collateralTooltipLabel}>{text.collateralTooltip(COLLATERAL_MIN_PERCENT)}</InfoTooltip>
          </dt>
          <dd className={`${typeScale.number} ${collateralClass}`}>{text.ratioPercent(ratios.collateralRatio ?? 0)}</dd>
          {ratios.collateralOk ? null : <p className="mt-1 text-xs font-medium text-red-600">{text.collateralWarning(COLLATERAL_MIN_PERCENT)}</p>}
        </div>
        <div>
          <dt className={`flex items-center gap-1 ${typeScale.label}`}>
            {text.loanRatio}
            <InfoTooltip label={text.loanTooltipLabel}>{text.loanTooltip(NEW_LOAN_MAX_PERCENT)}</InfoTooltip>
          </dt>
          <dd className={typeScale.number}>{text.ratioPercent(ratios.loanRatio ?? 0)}</dd>
          <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ratios.newLoanAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}>
            {ratios.newLoanAvailable ? text.newLoanAvailable : text.newLoanUnavailable}
          </p>
        </div>
      </dl>
    </section>
  )
}
