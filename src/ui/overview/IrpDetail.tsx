import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getStockBalance } from '../../app/kis/stock-balance-client'
import { withWeights } from '../../app/kis/holding-weights'
import { accountsText } from '../glossary/accounts'
import { overviewText as text } from '../glossary/overview'
import { IrpSummary } from './IrpSummary'
import { IrpHoldingRow } from './IrpHoldingRow'
import { IrpHoldingCard } from './IrpHoldingCard'

const headers = [text.name, text.quantity, text.evaluation, text.profitLoss, text.profitRate, text.weight]
const headerAlign = (index: number) => index === 0 ? 'text-left' : 'text-right'

export function IrpDetail({ accountId }: { accountId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['stock-balance', accountId, '29'],
    queryFn: ({ signal }) => getStockBalance(accountId, signal),
    retry: false,
  })
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 768px)').matches ?? false)
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 768px)')
    const resize = (event: MediaQueryListEvent) => setWide(event.matches)
    media?.addEventListener('change', resize)
    return () => media?.removeEventListener('change', resize)
  }, [])
  if (isPending) return <p role="status">{accountsText.loading}</p>
  if (isError) return <p role="alert">{text.unavailable}</p>
  const weighted = withWeights(data.holdings)
  return <section aria-label={text.detail} className="rounded-lg border border-primary-200 bg-white p-4">
    <h2 className="text-lg font-semibold">{text.detail}</h2>
    <IrpSummary summary={data.summary} />
    {weighted.length === 0 ? <p>{text.emptyHoldings}</p> : wide ? (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="text-left font-semibold">{text.holdings}</caption>
          <thead><tr>{headers.map((label, index) => <th key={label} scope="col" className={`border-b border-stone-200 py-3 pr-4 last:pr-0 ${headerAlign(index)}`}>{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-stone-100">{weighted.map((holding) => <IrpHoldingRow key={holding.code} holding={holding} />)}</tbody>
        </table>
      </div>
    ) : (
      <ul className="mt-4 flex flex-col gap-4">{weighted.map((holding) => <IrpHoldingCard key={holding.code} holding={holding} />)}</ul>
    )}
  </section>
}
