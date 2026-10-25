import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getStockBalance } from '../../app/kis/stock-balance-client'
import { withWeights } from '../../app/kis/holding-weights'
import { riskRatio } from '../../app/kis/risk-ratio'
import { accountsText } from '../glossary/accounts'
import { commonText } from '../glossary/common'
import { overviewText as text } from '../glossary/overview'
import { spacing, typeScale } from '../styles/type-scale'
import { Button } from '../components/Button'
import { IrpSummary } from './IrpSummary'
import { IrpHoldingRow } from './IrpHoldingRow'
import { IrpHoldingCard } from './IrpHoldingCard'
import { IrpCashCard, IrpCashRow } from './IrpCash'
import { useRiskClasses } from './useRiskClasses'

const headers = [text.name, text.quantity, text.evaluation, text.profitLoss, text.profitRate, text.weight, text.riskClass]
const headerAlign = (index: number) => index === 0 ? 'text-left' : 'text-right'

export function IrpDetail({ accountId }: { accountId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['stock-balance', accountId, '29'],
    queryFn: ({ signal }) => getStockBalance(accountId, signal),
    retry: false,
  })
  const { classes, toggle, isPending: riskPending, isError: riskError, isSaving, refetch } = useRiskClasses(accountId)
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 768px)').matches ?? false)
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 768px)')
    const resize = (event: MediaQueryListEvent) => setWide(event.matches)
    media?.addEventListener('change', resize)
    return () => media?.removeEventListener('change', resize)
  }, [])
  if (isPending) return <p role="status">{accountsText.loading}</p>
  if (isError) return <p role="alert">{text.unavailable}</p>
  const { holdings: weighted, cashWeight } = withWeights(data.holdings, data.summary.cash)
  const riskReady = !riskPending && !riskError
  const risk = riskRatio(data.holdings, data.summary.cash, classes)
  const disabled = !riskReady || isSaving
  const classOf = (code: string) => classes[code] ?? 'risk'
  const toggleFor = (code: string) => toggle({ stockCode: code, riskClass: classOf(code) === 'safe' ? 'risk' : 'safe' })
  return <section aria-label={text.detail} className={`${spacing.section} mb-8 rounded-lg border border-primary-200 bg-white p-4`}>
    <h2 className={typeScale.sectionTitle}>{text.detail}</h2>
    <IrpSummary summary={data.summary} risk={riskReady ? risk : undefined} />
    {riskPending ? <p role="status" className={typeScale.body}>{text.riskLoading}</p> : null}
    {riskError ? (
      <div role="alert" className="flex items-center gap-2 text-sm text-red-600">
        <span>{text.riskLoadFailed}</span>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { void refetch() }}>{commonText.retry}</Button>
      </div>
    ) : null}
    <div>
      <h3 className={`mb-3 ${typeScale.cardTitle}`}>{text.holdings}</h3>
      {weighted.length === 0 ? <p className={typeScale.body}>{text.emptyHoldings}</p> : null}
      {wide ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>{headers.map((label, index) => <th key={label} scope="col" className={`${typeScale.label} border-b border-stone-200 py-3 pr-4 last:pr-0 ${headerAlign(index)}`}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-stone-100">
              {weighted.map((holding) => <IrpHoldingRow key={holding.code} holding={holding} riskClass={classOf(holding.code)} onToggle={() => toggleFor(holding.code)} disabled={disabled} />)}
              <IrpCashRow cash={data.summary.cash} weight={cashWeight} />
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {weighted.map((holding) => <IrpHoldingCard key={holding.code} holding={holding} riskClass={classOf(holding.code)} onToggle={() => toggleFor(holding.code)} disabled={disabled} />)}
          <IrpCashCard cash={data.summary.cash} weight={cashWeight} />
        </ul>
      )}
    </div>
  </section>
}
