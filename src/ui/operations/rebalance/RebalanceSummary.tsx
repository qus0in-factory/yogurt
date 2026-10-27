import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { RebalanceHolding, RebalanceItem } from '../../../domain/rebalance/types'
import { InfoTooltip } from '../../components/InfoTooltip'
import { Sensitive } from '../../components/Sensitive'
import { StatGrid } from '../../components/StatGrid'
import { StatusBadge } from './RebalanceFillChip'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  holdings: RebalanceHolding[]
  cashAvailable: number
  cashSettled: number
  keepAmount: number
  items?: RebalanceItem[]
  prices?: Record<string, number>
}

const metric = (label: string, value: ReactNode) => ({
  label: <span className={typeScale.label}>{label}</span>,
  value,
})

export function RebalanceSummary({ holdings, cashAvailable, cashSettled, keepAmount, items, prices }: Props) {
  const evaluationAmount = holdings.reduce((sum, h) => sum + h.evaluationAmount, 0)
  const totalAmount = evaluationAmount + cashSettled
  const rawInvestable = totalAmount - keepAmount
  const investableAmount = Math.max(0, rawInvestable)
  const isExceeded = rawInvestable < 0
  const totalBuy = (items ?? []).filter((i) => i.side === 'buy')
    .reduce((sum, i) => sum + i.orderQuantity * (prices?.[i.code] ?? 0), 0)
  const totalSell = (items ?? []).filter((i) => i.side === 'sell')
    .reduce((sum, i) => sum + i.orderQuantity * (prices?.[i.code] ?? 0), 0)
  const isInsufficientBuy = totalBuy > cashSettled + totalSell
  const s = rebalanceText.summary
  const amount = rebalanceText.won

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <StatGrid
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8"
        items={[
          metric(s.totalAmount, <Sensitive className={typeScale.number}>{amount(totalAmount)}</Sensitive>),
          metric(s.evaluationAmount, <Sensitive className={typeScale.number}>{amount(evaluationAmount)}</Sensitive>),
          metric(s.cashAvailable, <Sensitive className={typeScale.number}>{amount(cashAvailable)}</Sensitive>),
          metric(s.cashSettled, <Sensitive className={typeScale.number}>{amount(cashSettled)}</Sensitive>),
          metric(s.keepAmount, (
            <>
              <Sensitive className={typeScale.number}>{amount(keepAmount)}</Sensitive>
              <span className="ml-1 inline-flex items-center gap-1">
                <InfoTooltip label={s.keepExcluded}>{s.keepExcluded}</InfoTooltip>
                <span className={typeScale.caption}>{s.keepExcludedShort}</span>
              </span>
            </>
          )),
          metric(s.investableAmount, (
            <Sensitive
              className={`font-semibold ${typeScale.number} ${isExceeded ? 'text-amber-600' : 'text-primary-700'}`}
            >
              {amount(investableAmount)}
            </Sensitive>
          )),
          metric(s.totalBuyAmount, (
            <Sensitive className={`font-semibold ${typeScale.number} text-red-600`}>{amount(totalBuy)}</Sensitive>
          )),
          metric(s.totalSellAmount, (
            <Sensitive className={`font-semibold ${typeScale.number} text-blue-600`}>{amount(totalSell)}</Sensitive>
          )),
        ]}
      />
      {isInsufficientBuy ? (
        <StatusBadge label={s.insufficientBuyNotice} tone="bg-amber-50 text-amber-800">
          <TriangleAlert aria-hidden="true" className="h-3 w-3" />
          <span>{s.insufficientBuyShort}</span>
        </StatusBadge>
      ) : null}
    </div>
  )
}
