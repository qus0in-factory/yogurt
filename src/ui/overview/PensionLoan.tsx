import type { AccountAssets } from '../../app/kis/account-assets-client'
import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'

export function PensionLoan({ summary, rows }: { summary: AccountAssets['summary']; rows: AccountAssets['rows'] }) {
  const rowLoan = rows.filter((row) => row.creditLoan > 0).reduce((sum, row) => sum + row.creditLoan, 0)
  return (
    <section aria-label={text.loanStatus}>
      <h3 className={typeScale.cardTitle}>{text.loanStatus}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <dt className={typeScale.label}>{text.loanAmount}</dt>
          <dd className={typeScale.number}>{text.won(summary.loanAmount)}</dd>
        </div>
        <div>
          <dt className={typeScale.label}>{text.loanRowsTotal}</dt>
          <dd className={typeScale.number}>{text.won(rowLoan)}</dd>
        </div>
      </dl>
    </section>
  )
}
