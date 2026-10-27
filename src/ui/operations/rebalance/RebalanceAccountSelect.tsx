import type { TargetAccountOption } from '../../../app/rebalance/types'
import { formatRebalanceAccountOption } from '../../glossary/rebalance-account'
import { useMaskStore } from '../../state/mask-store'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  options: TargetAccountOption[]
  selectedKey: string
  onSelectKey: (key: string) => void
}

export function RebalanceAccountSelect({ options, selectedKey, onSelectKey }: Props) {
  const masked = useMaskStore(state => state.masked)
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div>
        <label htmlFor="rebalance-account" className={`block mb-1 ${typeScale.label}`}>{rebalanceText.accountSelect}</label>
        <select
          id="rebalance-account"
          value={selectedKey}
          onChange={(e) => onSelectKey(e.target.value)}
          className="w-full rounded border border-stone-300 bg-white p-2.5 text-sm"
        >
          {options.map((opt) => {
            const key = `${opt.accountId}:${opt.productCode}`
            const prod = rebalanceText.products[opt.productCode]
            return <option key={key} value={key}>{formatRebalanceAccountOption(opt, prod, masked)}</option>
          })}
        </select>
      </div>
    </div>
  )
}
