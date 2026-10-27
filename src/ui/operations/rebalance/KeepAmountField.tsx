import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { rebalanceText } from '../../glossary/rebalance'
import { typeScale } from '../../styles/type-scale'

type Props = {
  savedAmount: number
  onSave: (keepAmount: number) => void
  isSaving?: boolean
  isError?: boolean
  isLoading?: boolean
}

export function KeepAmountField({ savedAmount, onSave, isSaving = false, isError = false, isLoading = false }: Props) {
  const [draft, setDraft] = useState(savedAmount)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (!dirty) setDraft(savedAmount)
  }, [savedAmount, dirty])

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-stone-200 bg-white p-4">
      <label htmlFor="rebalance-keep-amount" className={typeScale.label}>{rebalanceText.keepAmount}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            id="rebalance-keep-amount"
            type="number"
            min={0}
            step={10000}
            value={draft === 0 ? '' : draft}
            placeholder={rebalanceText.keepAmountPlaceholder}
            disabled={isLoading || isSaving}
            onChange={(e) => {
              setDirty(true)
              setDraft(Math.max(0, Math.floor(Number(e.target.value)) || 0))
            }}
            className="w-full rounded border border-stone-300 p-2.5 pr-8 text-right text-sm"
          />
          <span className="pointer-events-none absolute right-3 text-xs text-stone-400">{rebalanceText.keepAmountUnit}</span>
        </div>
        <Button variant="outline" className="min-h-11 px-4" disabled={isLoading || isSaving} onClick={() => onSave(draft)}>
          {rebalanceText.keepAmountSave}
        </Button>
      </div>
      {isError ? <p role="alert" className={`${typeScale.caption} text-red-600`}>{rebalanceText.keepAmountError}</p> : null}
    </div>
  )
}
