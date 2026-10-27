import type { TargetAccountOption } from '../../../app/rebalance/types'
import { formatRebalanceAccountOption } from '../../glossary/rebalance-account'
import { useMaskStore } from '../../state/mask-store'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  options: TargetAccountOption[]
  selectedKey: string
  onSelectKey: (key: string) => void
  keepAmount: number
  onChangeKeepAmount: (val: number) => void
}

export function RebalanceAccountSelect({ options, selectedKey, onSelectKey, keepAmount, onChangeKeepAmount }: Props) {
  const masked = useMaskStore(state => state.masked)
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
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
      <div className="w-full sm:w-48">
        <label htmlFor="rebalance-keep-amount" className={`block mb-1 ${typeScale.label}`}>{rebalanceText.keepAmount}</label>
        <div className="relative flex items-center">
          <input
            id="rebalance-keep-amount"
            type="number"
            min={0}
            step={10000}
            value={keepAmount === 0 ? '' : keepAmount}
            placeholder={rebalanceText.keepAmountPlaceholder}
            onChange={(e) => onChangeKeepAmount(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
            className="w-full rounded border border-stone-300 p-2.5 pr-8 text-right text-sm"
          />
          <span className="pointer-events-none absolute right-3 text-xs text-stone-400">{rebalanceText.keepAmountUnit}</span>
        </div>
      </div>
    </div>
  )
}
