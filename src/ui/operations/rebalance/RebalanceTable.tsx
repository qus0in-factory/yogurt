import { ArrowDown, ArrowLeftRight, ArrowUp } from 'lucide-react'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { Button } from '../../components/Button'
import { Sensitive } from '../../components/Sensitive'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'
import { sortRebalanceRows } from './sort-items'

type Props = {
  items: RebalanceItem[]; prices: Record<string, number>
  completedCodes: Set<string>; onCheck: (item: RebalanceItem) => void
}
export function RebalanceTable({ items, prices, completedCodes, onCheck }: Props) {
  const cell = `py-3 px-3 text-right ${typeScale.number}`
  const cols = rebalanceText.columns

  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full min-w-[640px] text-left">
        <thead className={`border-b border-stone-200 bg-stone-50 ${typeScale.label}`}>
          <tr>
            <th scope="col" className="py-3 px-3">{cols.stock}</th><th scope="col" className="py-3 px-3 text-right">{cols.currentPrice}</th>
            <th scope="col" className="py-3 px-3 text-right">{cols.currentQuantity}</th><th scope="col" className="py-3 px-3 text-right">{cols.targetQuantity}</th>
            <th scope="col" className="py-3 px-3 text-right">{cols.orderQuantity}</th><th scope="col" className="py-3 px-3 text-center">{cols.side}</th>
            <th scope="col" className="py-3 px-3 text-right">{cols.estimatedAmount}</th>
            <th scope="col" className="py-3 px-3 text-center">{cols.action}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sortRebalanceRows(items, prices).map((item) => {
            const completed = completedCodes.has(item.code)
            const price = prices[item.code]
            const hasPrice = typeof price === 'number' && Number.isFinite(price) && price > 0
            const amount = hasPrice ? item.orderQuantity * price : 0
            return (
              <tr key={item.code} className="hover:bg-stone-50/50">
                <td className="py-3 px-3">
                  <div className="flex flex-col"><span className={`font-medium ${typeScale.body}`}>{item.name}</span><span className="font-mono text-xs text-stone-400">{item.code}</span></div>
                </td>
                <td className={cell}>{hasPrice ? rebalanceText.won(price) : <span className="text-xs text-amber-600">{rebalanceText.noPrice}</span>}</td>
                <td className={cell}><Sensitive>{item.currentQuantity.toLocaleString('ko-KR')}</Sensitive></td>
                <td className={cell}><Sensitive>{item.targetQuantity.toLocaleString('ko-KR')}</Sensitive></td>
                <td className={cell}><Sensitive>{item.orderQuantity.toLocaleString('ko-KR')}</Sensitive></td>
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  {item.side === 'none' ? (
                    <span className="text-xs text-stone-400 whitespace-nowrap">{rebalanceText.side.none}</span>
                  ) : (
                    <div className="inline-flex flex-col items-center">
                      <span role="status" aria-label={rebalanceText.side[item.side]}
                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 ${typeScale.label} ${item.side === 'buy' ? 'bg-primary-100 text-primary-700' : 'bg-red-50 text-red-700'}`}>
                        {item.side === 'buy' ? <ArrowUp aria-hidden="true" className="h-3 w-3" /> : <ArrowDown aria-hidden="true" className="h-3 w-3" />}
                        {rebalanceText.side[item.side]}
                      </span>
                      {item.side === 'buy' ? (
                        <span className="text-[11px] text-stone-400 whitespace-nowrap">
                          {item.currentQuantity === 0 ? rebalanceText.subtext.newBuy : rebalanceText.subtext.addBuy}
                        </span>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className={cell}>{hasPrice ? <Sensitive>{rebalanceText.won(amount)}</Sensitive> : <span className="text-xs text-amber-600">{rebalanceText.noPrice}</span>}</td>
                <td className="py-3 px-3 text-center">
                  {completed ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{rebalanceText.action.completed}</span>
                  ) : item.side === 'none' ? <span className="text-stone-300">-</span>
                  : !hasPrice ? (
                    <Button variant="outline" size="icon" className="min-h-11 min-w-11 text-amber-600" disabled aria-disabled="true" aria-label={`${item.name} ${rebalanceText.noPrice}`}><ArrowLeftRight aria-hidden="true" className="h-4 w-4" /></Button>
                  ) : (
                    <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label={`${item.name} ${rebalanceText.action.trade}`} onClick={() => onCheck(item)}><ArrowLeftRight aria-hidden="true" className="h-4 w-4" /></Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
