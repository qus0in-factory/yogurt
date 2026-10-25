import type { ProductBalance } from '../../app/kis/account-assets-client'
import { withWeights } from '../../app/kis/holding-weights'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { IrpSummary } from './IrpSummary'
import { IrpHoldingRow } from './IrpHoldingRow'
import { IrpHoldingCard } from './IrpHoldingCard'
import { IrpCashCard, IrpCashRow } from './IrpCash'
import { holdingColumns } from './holding-columns'


export function PensionHoldings({ summary, holdings, wide, rp = 0 }: {
  summary: ProductBalance['summary']; holdings: ProductBalance['holdings']; wide: boolean; rp?: number
}) {
  const cash = summary.cash + rp
  const { holdings: weighted, cashWeight } = withWeights(holdings, cash)
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
            <thead><tr>{holdingColumns(false).map((column) => <th key={column.id} scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 ${column.align === 'left' ? 'text-left' : 'text-right'}`}>{column.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">
              {weighted.map((holding) => <IrpHoldingRow key={holding.code} holding={holding} showRiskToggle={false} />)}
              <IrpCashRow cash={cash} weight={cashWeight} showRiskColumn={false} />
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {weighted.map((holding) => <IrpHoldingCard key={holding.code} holding={holding} showRiskToggle={false} />)}
          <IrpCashCard cash={cash} weight={cashWeight} />
        </ul>
      )}
    </section>
  )
}
