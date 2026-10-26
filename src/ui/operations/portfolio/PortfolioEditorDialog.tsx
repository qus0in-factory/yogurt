import { MAX_PORTFOLIO_ITEMS } from '../../../domain/portfolio/limits'
import { formatBps } from '../../../domain/portfolio/weight'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { TextField } from '../../components/TextField'
import { portfolioText } from '../../glossary/portfolio'
import { typeScale } from '../../styles/type-scale'
import type { PortfolioEditorProps } from './portfolio-editor-types'
import { PortfolioItemRow } from './PortfolioItemRow'
import { usePortfolioEditor } from './usePortfolioEditor'

export function PortfolioEditorDialog({ open, onClose, onSubmit, initialValue, assignedCount = 0, serverError }: PortfolioEditorProps) {
  const { name, setName, items, hasCash, isMaxItems, totalBps, nameError, rowErrors, itemsError, canSave, addSecurityRow, addCashRow, removeRow, updateRow, setRowLoading, validate } = usePortfolioEditor(initialValue)

  const handleSave = () => {
    const draft = validate()
    if (draft) onSubmit(draft)
  }

  const diffText = totalBps < 10000 ? portfolioText.shortfall(formatBps(10000 - totalBps)) : totalBps > 10000 ? portfolioText.excess(formatBps(totalBps - 10000)) : null

  return (
    <Dialog open={open} onClose={onClose} title={initialValue ? portfolioText.editTitle : portfolioText.createTitle} className="md:max-w-2xl">
      <div className="flex flex-col gap-4">
        {assignedCount > 0 && <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">{portfolioText.assignedNotice(assignedCount)}</div>}
        {serverError && <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">{serverError}</div>}
        <TextField label={portfolioText.nameLabel} name="portfolioName" value={name} onChange={setName} error={nameError} placeholder={portfolioText.namePlaceholder} maxLength={40} />
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className={typeScale.label}>{portfolioText.itemsSectionTitle}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addSecurityRow} disabled={isMaxItems} aria-describedby={isMaxItems ? 'max-items-notice' : undefined}>{portfolioText.addStockButton}</Button>
              <Button type="button" variant="outline" size="sm" onClick={addCashRow} disabled={hasCash || isMaxItems} aria-describedby={isMaxItems ? 'max-items-notice' : undefined}>{portfolioText.addCashButton}</Button>
            </div>
          </div>
          {isMaxItems && <p id="max-items-notice" className="text-right text-xs text-stone-500">{portfolioText.maxItemsNotice(MAX_PORTFOLIO_ITEMS)}</p>}
        </div>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {items.map((it) => (
            <PortfolioItemRow key={it.id} item={it} errors={rowErrors[it.id]} onChange={(field, val) => updateRow(it.id, field, val)} onLoadingChange={(loading) => setRowLoading(it.id, loading)} onRemove={() => removeRow(it.id)} />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-stone-200 pt-3">
          <span className={typeScale.label}>{portfolioText.totalLabel}</span>
          <div className="flex items-center gap-2">
            <span className={typeScale.number}>{formatBps(totalBps)}</span>
            {diffText && <span className="text-xs text-red-600">({diffText})</span>}
          </div>
        </div>
        {itemsError && <p className="text-xs text-red-600">{itemsError}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>{portfolioText.cancelButton}</Button>
          <Button type="button" variant="default" disabled={!canSave} onClick={handleSave}>{portfolioText.saveButton}</Button>
        </div>
      </div>
    </Dialog>
  )
}
