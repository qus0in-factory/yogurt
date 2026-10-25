import { useQuery } from '@tanstack/react-query'
import { getStockBalance } from '../../app/kis/stock-balance-client'
import { accountsText } from '../glossary/accounts'
import { overviewText as text } from '../glossary/overview'

export function IrpDetail({ accountId }: { accountId: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['stock-balance', accountId, '29'],
    queryFn: ({ signal }) => getStockBalance(accountId, signal),
    retry: false,
  })
  if (isPending) return <p role="status">{accountsText.loading}</p>
  if (isError) return <p role="alert">{text.unavailable}</p>
  const { summary, holdings } = data
  const rate = summary.purchaseAmount === 0 ? 0 : summary.profitLoss / summary.purchaseAmount * 100
  return <section aria-label={text.detail} className="rounded-lg border border-primary-200 bg-white p-4">
    <h2 className="text-lg font-semibold">{text.detail}</h2>
    <dl className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div><dt>{text.totalEvaluation}</dt><dd>{text.won(summary.totalEvaluation)}</dd></div>
      <div><dt>{text.cash}</dt><dd>{text.won(summary.cash)}</dd></div>
      <div><dt>{text.profitLoss}</dt><dd>{text.won(summary.profitLoss)}</dd></div>
      <div><dt>{text.profitRate}</dt><dd>{text.percent(rate)}</dd></div>
    </dl>
    {holdings.length === 0 ? <p>{text.emptyHoldings}</p> : <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="text-left font-semibold">{text.holdings}</caption>
        <thead><tr>{[text.name, text.quantity, text.evaluation, text.profitLoss, text.profitRate]
          .map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
        <tbody>{holdings.map(holding => <tr key={holding.code}>
          <th scope="row" className="p-2">{holding.name}</th>
          <td className="p-2">{text.number(holding.quantity)}</td>
          <td className="p-2">{text.won(holding.evaluationAmount)}</td>
          <td className="p-2">{text.won(holding.profitLoss)}</td>
          <td className="p-2">{text.percent(holding.profitLossRate)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>
}
