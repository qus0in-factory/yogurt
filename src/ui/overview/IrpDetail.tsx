import { useQuery } from '@tanstack/react-query'
import { PackageOpen } from 'lucide-react'
import { getStockBalance } from '../../app/kis/stock-balance-client'
import { withWeights } from '../../app/kis/holding-weights'
import { riskRatio } from '../../app/kis/risk-ratio'
import { accountsText } from '../glossary/accounts'
import { commonText } from '../glossary/common'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { Button } from '../components/Button'
import { Carousel } from '../components/Carousel'
import { EmptyState } from '../components/EmptyState'
import { IrpSummary } from './IrpSummary'
import { IrpHoldingRow } from './IrpHoldingRow'
import { IrpHoldingCard } from './IrpHoldingCard'
import { IrpCashCard, IrpCashRow } from './IrpCash'
import { holdingColumns } from './holding-columns'
import { useRiskClasses } from './useRiskClasses'
import { useAdaptiveWidth } from '../lib/useAdaptiveWidth'
export function IrpDetail({ accountId }: { accountId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['stock-balance', accountId, '29'],
    queryFn: ({ signal }) => getStockBalance(accountId, signal),
    retry: false,
  })
  const { classes, toggle, isPending: riskPending, isError: riskError, isSaving, refetch } = useRiskClasses(accountId)
  const width = useAdaptiveWidth()
  const wide = width === 'desktop'
  if (isPending) return <p role="status">{accountsText.loading}</p>
  if (isError) return <p role="alert">{text.unavailable}</p>
  const { holdings: weighted, cashWeight } = withWeights(data.holdings, data.summary.cash)
  const riskReady = !riskPending && !riskError
  const risk = riskRatio(data.holdings, data.summary.cash, classes)
  const disabled = !riskReady || isSaving
  const classOf = (code: string) => classes[code] ?? 'risk'
  const toggleFor = (code: string) => toggle({ stockCode: code, riskClass: classOf(code) === 'safe' ? 'risk' : 'safe' })
  const mobileItems = weighted.length
    ? [...weighted.map((holding) => ({ holding })), { holding: null }]
    : [{ holding: null, empty: true }, { holding: null }]
  return <section aria-label={text.detail} className={`${spacing.section} mb-8 rounded-lg border border-primary-200 bg-white p-4 max-[768px]:gap-4 max-[768px]:p-3 max-[375px]:gap-3`}>
    <h2 className={typeScale.section}>{text.detail}</h2>
    <IrpSummary summary={data.summary} risk={riskReady ? risk : undefined} />
    {riskPending ? <p role="status" className={typeScale.body}>{text.riskLoading}</p> : null}
    {riskError ? (
      <div role="alert" className={`flex items-center gap-2 ${typeScale.body} text-red-600`}>
        <span>{text.riskLoadFailed}</span>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { void refetch() }}>{commonText.retry}</Button>
      </div>
    ) : null}
    <div>
      <h3 className={`mb-3 ${typeScale.title}`}>{text.holdings}</h3>
      {wide ? (
        <>
          {weighted.length === 0 ? <EmptyState icon={PackageOpen} title={text.emptyHoldings} className="py-8" /> : null}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>{holdingColumns(true).map((column) => <th key={column.id} scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 ${column.align === 'left' ? 'text-left' : 'text-right'}`}>{column.label}</th>)}</tr></thead>
              <tbody className="divide-y divide-stone-100">
                {weighted.map((holding) => <IrpHoldingRow key={holding.code} holding={holding} riskClass={classOf(holding.code)} onToggle={() => toggleFor(holding.code)} disabled={disabled} />)}
                <IrpCashRow cash={data.summary.cash} weight={cashWeight} />
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Carousel
          items={mobileItems}
          labels={{ list: text.holdingsList, previous: text.previousHolding, next: text.nextHolding, goTo: text.holdingGoTo, position: text.holdingPosition }}
          renderItem={(item) => 'empty' in item
            ? <EmptyState key="empty" icon={PackageOpen} title={text.emptyHoldings} className="py-8" />
            : item.holding
              ? <IrpHoldingCard key={item.holding.code} holding={item.holding} riskClass={classOf(item.holding.code)} onToggle={() => toggleFor(item.holding.code)} disabled={disabled} />
              : <IrpCashCard key="cash" cash={data.summary.cash} weight={cashWeight} />}
        />
      )}
    </div>
  </section>
}
