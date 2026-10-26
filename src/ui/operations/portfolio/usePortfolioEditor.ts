import { useId, useMemo, useState } from 'react'
import { CASH_ITEM_NAME } from '../../../domain/portfolio/item'
import { portfolioDraftSchema, type PortfolioDraft } from '../../../domain/portfolio/portfolio'
import { parsePercentToBps } from '../../../domain/portfolio/weight'
import { portfolioText } from '../../glossary/portfolio'
import type { EditorItem, RowErrors } from './portfolio-editor-types'

const toEditorItems = (draft?: PortfolioDraft): EditorItem[] =>
  draft?.items.map((it, idx) => ({
    id: `item-${idx}-${Date.now()}`,
    kind: it.kind,
    stockCode: it.stockCode ?? '',
    stockName: it.stockName,
    weightPercent: (it.targetWeightBps / 100).toFixed(2),
  })) ?? []

export function usePortfolioEditor(initial?: PortfolioDraft) {
  const baseId = useId()
  const [name, setName] = useState(initial?.name ?? '')
  const [items, setItems] = useState<EditorItem[]>(() => toEditorItems(initial))
  const [nameError, setNameError] = useState<string>()
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({})
  const [itemsError, setItemsError] = useState<string>()

  const hasCash = items.some((it) => it.kind === 'cash')
  const totalBps = useMemo(
    () => items.reduce((sum, it) => sum + (parsePercentToBps(it.weightPercent) ?? 0), 0),
    [items],
  )

  const addSecurityRow = () => setItems((prev) => [...prev, { id: `${baseId}-${Date.now()}-${prev.length}`, kind: 'security', stockCode: '', stockName: '', weightPercent: '' }])
  const addCashRow = () => {
    if (hasCash) return
    setItems((prev) => [...prev, { id: `${baseId}-${Date.now()}-${prev.length}`, kind: 'cash', stockCode: '', stockName: CASH_ITEM_NAME, weightPercent: '' }])
  }
  const removeRow = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id))
  const updateRow = (id: string, field: keyof EditorItem, val: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)))

  const validate = (): PortfolioDraft | null => {
    setNameError(undefined); setRowErrors({}); setItemsError(undefined)
    const nextRowErrors: Record<string, RowErrors> = {}
    const rawItems = items.map((it) => {
      const bps = parsePercentToBps(it.weightPercent)
      if (bps === null) nextRowErrors[it.id] = { ...nextRowErrors[it.id], weight: portfolioText.errors.weightInvalid }
      return { kind: it.kind, stockCode: it.kind === 'security' ? it.stockCode.trim().toUpperCase() : null, stockName: it.stockName.trim(), targetWeightBps: bps ?? 0 }
    })
    const res = portfolioDraftSchema.safeParse({ name: name.trim(), items: rawItems })
    if (res.success) return res.data
    res.error.issues.forEach((iss) => {
      if (iss.path[0] === 'name') setNameError(portfolioText.errors.nameRequired)
      else if (iss.path[0] === 'items' && iss.path.length === 1) setItemsError(portfolioText.errors.totalNot100)
      else if (iss.path[0] === 'items' && typeof iss.path[1] === 'number') {
        const id = items[iss.path[1]]?.id
        if (!id) return
        const field = iss.path[2]
        if (field === 'stockCode') nextRowErrors[id] = { ...nextRowErrors[id], stockCode: iss.message === 'DUPLICATE_STOCK' ? portfolioText.errors.duplicateStock : portfolioText.errors.stockCodeInvalid }
        else if (field === 'stockName') nextRowErrors[id] = { ...nextRowErrors[id], stockName: portfolioText.errors.stockNameRequired }
        else if (iss.message === 'DUPLICATE_CASH') nextRowErrors[id] = { ...nextRowErrors[id], weight: portfolioText.errors.duplicateCash }
      }
    })
    setRowErrors(nextRowErrors)
    return null
  }

  const canSave = Boolean(name.trim()) && items.length > 0 && totalBps === 10000 && Object.keys(rowErrors).length === 0
  return { name, setName, items, hasCash, totalBps, nameError, rowErrors, itemsError, canSave, addSecurityRow, addCashRow, removeRow, updateRow, validate }
}
