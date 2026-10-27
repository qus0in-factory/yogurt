import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

export function RebalanceTableHeader() {
  const cols = rebalanceText.columns
  return (
    <thead className={`border-b border-stone-200 bg-stone-50 ${typeScale.label}`}>
      <tr>
        <th scope="col" className="py-3 px-3">{cols.stock}</th><th scope="col" className="py-3 px-3 text-right">{cols.currentPrice}</th>
        <th scope="col" className="py-3 px-3 text-right">{cols.currentWeight}</th><th scope="col" className="py-3 px-3 text-right">{cols.targetWeight}</th>
        <th scope="col" className="py-3 px-3 text-right">{cols.currentQuantity}</th><th scope="col" className="py-3 px-3 text-right">{cols.targetQuantity}</th>
        <th scope="col" className="py-3 px-3 text-right">{cols.orderQuantity}</th><th scope="col" className="py-3 px-3 text-center">{cols.side}</th>
        <th scope="col" className="py-3 px-3 text-right">{cols.estimatedAmount}</th><th scope="col" className="py-3 px-3 text-center">{cols.action}</th>
      </tr>
    </thead>
  )
}
