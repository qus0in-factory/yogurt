import { Trash2 } from 'lucide-react'
import { CASH_ITEM_NAME } from '../../../domain/portfolio/item'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { portfolioText } from '../../glossary/portfolio'
import { cn } from '../../lib/cn'
import { typeScale } from '../../styles/type-scale'
import type { EditorItem, RowErrors } from './portfolio-editor-types'
import { useItemRowLookup } from './useItemRowLookup'

type Props = {
  item: EditorItem
  errors?: RowErrors
  onChange: (field: keyof EditorItem, val: string) => void
  onLoadingChange?: (loading: boolean) => void
  onRemove: () => void
}

export function PortfolioItemRow({ item, errors, onChange, onLoadingChange, onRemove }: Props) {
  const isCash = item.kind === 'cash'
  const { message, trigger, isError } = useItemRowLookup(item, onChange, onLoadingChange)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-stone-200 p-3 md:flex-row md:items-center">
      {isCash ? (
        <div className="flex-1 py-2"><span className={typeScale.label}>{CASH_ITEM_NAME}</span></div>
      ) : (
        <>
          <div className="w-full md:w-32">
            <TextField
              label={portfolioText.stockCodeLabel} name="stockCode" value={item.stockCode}
              onChange={(val) => {
                onChange('stockCode', val)
                if (item.stockName) onChange('stockName', '')
              }}
              onBlur={() => trigger(item.stockCode)}
              error={errors?.stockCode} placeholder={portfolioText.stockCodePlaceholder} maxLength={20}
            />
            {message ? (
              <p className={cn('text-xs mt-1', isError ? 'text-amber-600' : 'text-stone-500')}>
                {message}
              </p>
            ) : null}
          </div>
          <div className="flex-1">
            <TextField
              label={portfolioText.stockNameLabel} name="stockName" value={item.stockName}
              readOnly onChange={() => {}}
              error={errors?.stockName} placeholder={portfolioText.stockNamePlaceholder} maxLength={80}
            />
          </div>
        </>
      )}
      <div className="w-full md:w-28">
        <TextField
          label={portfolioText.weightLabel} name="weightPercent" value={item.weightPercent}
          onChange={(val) => onChange('weightPercent', val)}
          error={errors?.weight} placeholder={portfolioText.weightPlaceholder}
        />
      </div>
      <div className="flex justify-end pt-1 md:pt-6">
        <Button
          type="button" variant="ghost" size="icon" aria-label={portfolioText.removeRowLabel}
          className="min-h-[44px] min-w-[44px] text-stone-400 hover:text-red-600"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
