import { formatPercentFixed2 } from '../../../app/format/numbers'
import { cashTargetAmount, cashWeightPercent, settledCash, targetWeightPercent } from '../../../domain/rebalance/weights'
import { Sensitive } from '../../components/Sensitive'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  cash: number; cashSettled?: number | null; cashTargetBps?: number; weightBase: number; keepAmount?: number; cell: string
}

// 종목 행 다음에 두는 현금 행. 수량·구분·매매 칸은 비워 둔다.
export function RebalanceCashRow({ cash, cashSettled, cashTargetBps = 0, weightBase, keepAmount = 0, cell }: Props) {
  const settled = settledCash({ cash, cashSettled })
  const portfolioCash = Math.max(0, settled - keepAmount)
  const target = cashTargetAmount(weightBase, cashTargetBps)
  return (
    <tr className="hover:bg-stone-50/50">
      <td className="py-3 px-3"><span className={`font-medium ${typeScale.body}`}>{rebalanceText.cashRow}</span></td>
      <td className={cell}>-</td>
      <td className={cell}>{formatPercentFixed2(cashWeightPercent(portfolioCash, weightBase))}</td>
      <td className={cell}>{formatPercentFixed2(targetWeightPercent(cashTargetBps))}</td>
      <td className={cell}><Sensitive>{rebalanceText.won(portfolioCash)}</Sensitive></td>
      <td className={cell}><Sensitive>{rebalanceText.won(target)}</Sensitive></td>
      <td className={cell}>-</td>
      <td className="py-3 px-3 text-center"><span className="text-stone-300">-</span></td>
      <td className={cell}>-</td>
      <td className="py-3 px-3 text-center"><span className="text-stone-300">-</span></td>
    </tr>
  )
}
