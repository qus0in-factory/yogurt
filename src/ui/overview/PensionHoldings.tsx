import type { ProductBalance } from '../../app/kis/account-assets-client'
import { withWeights } from '../../app/kis/holding-weights'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { IrpSummary } from './IrpSummary'
import { IrpHoldingRow } from './IrpHoldingRow'
import { IrpHoldingCard } from './IrpHoldingCard'
import { IrpCashCard, IrpCashRow } from './IrpCash'

const headers = [text.name, text.quantity, text.evaluation, text.profitLoss, text.profitRate, text.weight]
const align = (index: number) => index === 0 ? 'text-left' : 'text-right'

export function PensionHoldings({ summary, holdings, wide }: {
  summary: ProductBalance['summary']; holdings: ProductBalance['holdings']; wide: boolean
}) {
  const { holdings: weighted, cashWeight } = withWeights(holdings, summary.cash)
  const summaryProps = {
    totalEvaluation: summary.totalEvaluation, cash: summary.cash,
    profitLoss: summary.profitLoss, purchaseAmount: summary.purchaseAmount,
  }
  return (
    <section aria-label={text.depositStocks} className={spacing.section}>
      <h3 className={typeScale.cardTitle}>{text.depositStocks}</h3>
      <IrpSummary summary={summaryProps} />
      {wide ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{headers.map((label, index) => <th key={label} scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 last:pr-0 ${align(index)}`}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">
              {weighted.map((holding) => <IrpHoldingRow key={holding.code} holding={holding} showRiskToggle={false} />)}
              <IrpCashRow cash={summary.cash} weight={cashWeight} showRiskColumn={false} />
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {weighted.map((holding) => <IrpHoldingCard key={holding.code} holding={holding} showRiskToggle={false} />)}
          <IrpCashCard cash={summary.cash} weight={cashWeight} />
        </ul>
      )}
    </section>
  )
}
