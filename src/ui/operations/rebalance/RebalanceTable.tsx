import { ArrowDown, ArrowLeftRight, ArrowUp, BadgeCheck, HelpCircle, TriangleAlert } from 'lucide-react'
import { formatPercentFixed2 } from '../../../app/format/numbers'
import { currentWeightPercent, targetWeightPercent } from '../../../domain/rebalance/weights'
import { allowedBuyQuantity } from '../../../domain/rebalance/buy-limit'
import type { RebalanceItem } from '../../../domain/rebalance/types'
import { Button } from '../../components/Button'
import { InfoTooltip } from '../../components/InfoTooltip'
import { Sensitive } from '../../components/Sensitive'
import { marketText } from '../../glossary/market'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'
import { RebalanceFillChip, StatusBadge, type FillChipStatus } from './RebalanceFillChip'
import { RebalanceCashRow } from './RebalanceCashRow'
import { UnknownOrderActions } from './UnknownOrderActions'
import { RebalanceTableHeader } from './RebalanceTableHeader'
import { sortRebalanceRows } from './sort-items'
type Props = {
  onClearUnknown?: (item: RebalanceItem) => void; items: RebalanceItem[]; prices: Record<string, number>; completedCodes?: Set<string>; unknownCodes?: Set<string>
  completedKeys?: Set<string>; unknownKeys?: Set<string>; onCheck: (item: RebalanceItem) => void; isMarketOpen?: boolean; disabledReason?: string; fillStatuses?: Record<string, FillChipStatus>; noOrderIdKeys?: Set<string>
  targetBps?: Record<string, number>; weightBase?: number; cash?: number; cashSettled?: number | null; cashTargetBps?: number; keepAmount?: number
  buyGateOpen?: boolean; buyLimit?: number; buyBlockedReason?: 'wait' | 'cancelled' | null; buyChecking?: boolean; fillEventsByKey?: Record<string, FillChipStatus>
}
export function RebalanceTable({ onClearUnknown, items, prices, completedCodes, unknownCodes, completedKeys, unknownKeys, onCheck, isMarketOpen = true, disabledReason, fillStatuses, noOrderIdKeys, targetBps, weightBase = 0, cash = 0, cashSettled = null, cashTargetBps = 0, keepAmount = 0, buyGateOpen = true, buyLimit = Number.POSITIVE_INFINITY, buyBlockedReason = null, buyChecking = false, fillEventsByKey }: Props) {
  const cell = `py-3 px-3 text-right ${typeScale.number}`; return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">{buyBlockedReason === 'cancelled' ? <p role="alert" className="border-b border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{rebalanceText.buyCancelled}</p> : buyBlockedReason === 'wait' ? <p role="status" className="border-b border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">{rebalanceText.buyWait}</p> : buyChecking ? <p role="status" className="border-b border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">{rebalanceText.otherBuyChecking}</p> : null}<table className="w-full min-w-[640px] text-left">
        <RebalanceTableHeader />
        <tbody className="divide-y divide-stone-100">
          {sortRebalanceRows(items, prices).map((item) => {
            const key = `${item.code}:${item.side}`, price = prices[item.code]
            const allowedBuy = item.side === 'buy' ? allowedBuyQuantity(item.orderQuantity, buyLimit, price ?? 0) : item.orderQuantity
            const isBuyChecking = item.side === 'buy' && (unknownKeys?.has(key) || (completedKeys?.has(key) && fillStatuses?.[key] !== 'filled') || (fillStatuses?.[key] !== undefined && fillStatuses[key] !== 'filled') || noOrderIdKeys?.has(key))
            const blockedByOtherBuy = buyChecking && !isBuyChecking
            const completed = completedKeys ? completedKeys.has(key) : completedCodes?.has(item.code); const isUnknown = unknownKeys ? unknownKeys.has(key) : unknownCodes?.has(item.code)
            const settled = fillEventsByKey?.[key]
            const hasPrice = typeof price === 'number' && Number.isFinite(price) && price > 0
            const amount = hasPrice ? item.orderQuantity * price : 0
            return (
              <tr key={key} className="hover:bg-stone-50/50">
                <td className="py-3 px-3"><div className="flex flex-col"><span className={`font-medium ${typeScale.body}`}>{item.name}</span><span className="font-mono text-xs text-stone-400">{item.code}</span>{item.sellableWarning ? <span className="inline-flex items-center gap-1"><TriangleAlert aria-hidden="true" className="h-3.5 w-3.5 text-amber-600" /><InfoTooltip label={rebalanceText.sellableWarning[item.sellableWarning]}>{rebalanceText.sellableWarning[item.sellableWarning]}</InfoTooltip></span> : null}</div></td>
                <td className={cell}>{hasPrice ? rebalanceText.won(price) : <span className="text-xs text-amber-600">{rebalanceText.noPrice}</span>}</td><td className={cell}>{formatPercentFixed2(currentWeightPercent(item.currentQuantity, price, weightBase))}</td>
                <td className={cell}>{formatPercentFixed2(targetWeightPercent(targetBps?.[item.code]))}</td>
                <td className={cell}><Sensitive>{item.currentQuantity.toLocaleString('ko-KR')}</Sensitive></td><td className={cell}><Sensitive>{item.targetQuantity.toLocaleString('ko-KR')}</Sensitive></td>
                <td className={cell}><Sensitive>{item.orderQuantity.toLocaleString('ko-KR')}</Sensitive>{item.side === 'buy' && buyGateOpen && allowedBuy < item.orderQuantity ? <span className="whitespace-nowrap text-amber-700" role="img" aria-label={rebalanceText.buyLimited(allowedBuy)}> ({allowedBuy.toLocaleString('ko-KR')})</span> : null}{item.side === 'buy' && buyGateOpen && allowedBuy < item.orderQuantity ? <InfoTooltip label={rebalanceText.buyLimited(allowedBuy)}>{rebalanceText.buyLimited(allowedBuy)}</InfoTooltip> : null}</td>
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  {item.side === 'none' ? <span className="text-xs text-stone-400 whitespace-nowrap">{rebalanceText.side.none}</span> : (
                    <div className="inline-flex flex-col items-center">
                      <span role="status" aria-label={rebalanceText.side[item.side]}
                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 ${typeScale.label} ${item.side === 'buy' ? 'bg-primary-100 text-primary-700' : 'bg-red-50 text-red-700'}`}>
                        {item.side === 'buy' ? <ArrowUp aria-hidden="true" className="h-3 w-3" /> : <ArrowDown aria-hidden="true" className="h-3 w-3" />}
                        {rebalanceText.side[item.side]}
                      </span>
                      {item.side === 'buy' && <span className="text-[11px] text-stone-400 whitespace-nowrap">{item.currentQuantity === 0 ? rebalanceText.subtext.newBuy : rebalanceText.subtext.addBuy}</span>}
                    </div>
                  )}
                </td>
                <td className={cell}>{hasPrice ? <Sensitive>{rebalanceText.won(amount)}</Sensitive> : <span className="text-xs text-amber-600">{rebalanceText.noPrice}</span>}</td>
                <td className="py-3 px-3 text-center">
                  {settled ? <RebalanceFillChip status={settled} /> : completed ? (noOrderIdKeys?.has(key) ? <RebalanceFillChip status="noOrderId" /> : fillStatuses?.[key] ? <RebalanceFillChip status={fillStatuses[key]} /> : <StatusBadge label={rebalanceText.action.completed} tone="bg-emerald-50 text-emerald-700"><BadgeCheck aria-hidden="true" className="h-3 w-3" /></StatusBadge>)
                  : isUnknown ? (
                    <span className="inline-flex items-center gap-1"><Button variant="outline" size="icon" className="min-h-11 min-w-11 text-amber-700 border-amber-300 bg-amber-50" aria-label={`${item.name} ${marketText.needsConfirmation}`} onClick={() => onCheck(item)}><HelpCircle aria-hidden="true" className="h-4 w-4" /></Button>
                      <InfoTooltip label={marketText.needsConfirmation}>{marketText.needsConfirmation}</InfoTooltip>{onClearUnknown && <UnknownOrderActions onClear={() => onClearUnknown(item)} />}</span>
                  ) : item.side === 'none' ? <span className="text-stone-300">-</span>
                  : !hasPrice || !isMarketOpen || (item.side === 'buy' && (!buyGateOpen || allowedBuy <= 0 || blockedByOtherBuy)) ? (
                    <Button variant="outline" size="icon" className="min-h-11 min-w-11 text-amber-600" disabled aria-disabled="true"
                      aria-describedby={!isMarketOpen ? 'market-status-notice' : undefined}
                      aria-label={!hasPrice ? `${item.name} ${rebalanceText.noPrice}` : `${item.name} ${rebalanceText.action.trade}`}
                      title={!isMarketOpen ? disabledReason : undefined}><ArrowLeftRight aria-hidden="true" className="h-4 w-4" /></Button>
                  ) : (
                    <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label={`${item.name} ${rebalanceText.action.trade}`} onClick={() => onCheck(item.side === 'buy' ? { ...item, orderQuantity: allowedBuy } : item)}><ArrowLeftRight aria-hidden="true" className="h-4 w-4" /></Button>
                  )}
                </td>
              </tr>
            )
          })}
          <RebalanceCashRow cash={cash} cashSettled={cashSettled} cashTargetBps={cashTargetBps} weightBase={weightBase} keepAmount={keepAmount} cell={cell} />
        </tbody>
      </table>
    </div>
  )
}
