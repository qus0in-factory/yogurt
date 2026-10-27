import type { ProductBalance } from '../../app/kis/account-assets-client'
import { withWeights } from '../../app/kis/holding-weights'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { Carousel } from '../components/Carousel'
import { IrpSummary } from './IrpSummary'
import { IrpHoldingRow } from './IrpHoldingRow'
import { IrpHoldingCard } from './IrpHoldingCard'
import { IrpCashCard, IrpCashRow } from './IrpCash'
import { holdingColumns } from './holding-columns'


export function PensionHoldings({ summary, holdings, wide, rp = 0, showHoldings = true, showCash = true }: {
  summary: ProductBalance['summary']; holdings: ProductBalance['holdings']; wide: boolean; rp?: number
  showHoldings?: boolean; showCash?: boolean
}) {
  const cashD2 = summary.cashD2 ?? summary.cash
  const cash = cashD2 + rp
  const { holdings: weighted, cashWeight } = withWeights(holdings, cash)
  if (!showHoldings && !showCash) return null
  const summaryProps = {
    totalEvaluation: summary.stockEvaluation + cashD2 + rp, cash: cashD2, cashAvailable: summary.cash,
    profitLoss: summary.profitLoss, purchaseAmount: summary.purchaseAmount,
  }
  return (    <section aria-label={text.depositStocks} className={`${spacing.section} max-[768px]:gap-4 max-[375px]:gap-3`}>
      <h3 className={typeScale.title}>{text.depositStocks}</h3>
      <IrpSummary summary={summaryProps} showCash={showCash} />
      {wide ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{holdingColumns(false).map((column) => <th key={column.id} scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 ${column.align === 'left' ? 'text-left' : 'text-right'}`}>{column.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">
              {showHoldings ? weighted.map((holding) => <IrpHoldingRow key={holding.code} holding={holding} showRiskToggle={false} />) : null}
              {showCash ? <IrpCashRow cash={cash} cashAvailable={summary.cash} weight={cashWeight} showRiskColumn={false} /> : null}
            </tbody>
          </table>
        </div>
      ) : (
        <Carousel
          items={[...(showHoldings ? weighted.map((holding) => ({ holding })) : []), ...(showCash ? [{ holding: null }] : [])]}
          labels={{ list: text.holdingsList, previous: text.previousHolding, next: text.nextHolding, goTo: text.holdingGoTo, position: text.holdingPosition }}
          renderItem={(item) => item.holding
            ? <IrpHoldingCard key={item.holding.code} holding={item.holding} showRiskToggle={false} />
            : <IrpCashCard key="cash" cash={cash} cashAvailable={summary.cash} weight={cashWeight} />}
        />
      )}
    </section>
  )
}
