import type { RebalanceHolding, RebalanceItem } from '../../../domain/rebalance/types'
import { Sensitive } from '../../components/Sensitive'
import { StatGrid } from '../../components/StatGrid'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  holdings: RebalanceHolding[]
  cash: number
  keepAmount: number
  items?: RebalanceItem[]
  prices?: Record<string, number>
}

export function RebalanceSummary({ holdings, cash, keepAmount, items, prices }: Props) {
  const evaluationAmount = holdings.reduce((sum, h) => sum + h.evaluationAmount, 0)
  const totalAmount = evaluationAmount + cash
  const rawInvestable = totalAmount - keepAmount
  const investableAmount = Math.max(0, rawInvestable)
  const isExceeded = rawInvestable < 0
  const totalBuy = (items ?? []).filter((i) => i.side === 'buy').reduce((sum, i) => sum + i.orderQuantity * (prices?.[i.code] ?? 0), 0)
  const totalSell = (items ?? []).filter((i) => i.side === 'sell').reduce((sum, i) => sum + i.orderQuantity * (prices?.[i.code] ?? 0), 0)
  const s = rebalanceText.summary

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <StatGrid
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
        items={[
          { label: <span className={typeScale.label}>{s.totalAmount}</span>, value: <Sensitive className={typeScale.number}>{totalAmount.toLocaleString('ko-KR')}원</Sensitive> },
          { label: <span className={typeScale.label}>{s.evaluationAmount}</span>, value: <Sensitive className={typeScale.number}>{evaluationAmount.toLocaleString('ko-KR')}원</Sensitive> },
          { label: <span className={typeScale.label}>{s.cash}</span>, value: <Sensitive className={typeScale.number}>{cash.toLocaleString('ko-KR')}원</Sensitive> },
          { label: <span className={typeScale.label}>{s.keepAmount}</span>, value: <Sensitive className={typeScale.number}>{keepAmount.toLocaleString('ko-KR')}원</Sensitive> },
          { label: <span className={typeScale.label}>{s.investableAmount}</span>, value: <Sensitive className={`font-semibold ${typeScale.number} ${isExceeded ? 'text-amber-600' : 'text-primary-700'}`}>{investableAmount.toLocaleString('ko-KR')}원</Sensitive> },
          { label: <span className={typeScale.label}>{s.totalBuyAmount}</span>, value: <Sensitive className={`font-semibold ${typeScale.number} text-red-600`}>{totalBuy.toLocaleString('ko-KR')}원</Sensitive> },
          { label: <span className={typeScale.label}>{s.totalSellAmount}</span>, value: <Sensitive className={`font-semibold ${typeScale.number} text-blue-600`}>{totalSell.toLocaleString('ko-KR')}원</Sensitive> },
        ]}
      />
      {isExceeded ? <p role="alert" className="mt-3 text-xs text-amber-600">{s.exceedsNotice}</p> : null}
    </div>
  )
}
