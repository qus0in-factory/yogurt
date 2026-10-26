import { useState } from 'react'
import { useCreatePortfolio, useUpdatePortfolio } from '../../../app/portfolio/queries'
import type { PortfolioAssignment } from '../../../domain/portfolio/assignment'
import type { Portfolio, PortfolioDraft } from '../../../domain/portfolio/portfolio'
import { portfolioListText } from '../../glossary/portfolio-list'
import { buildDuplicatePortfolioDraft } from './portfolio-list-model'

type EditorMode =
  | { type: 'create'; initialValue?: PortfolioDraft; key: string }
  | { type: 'edit'; portfolio: Portfolio }
  | null

export function usePortfolioEditorController(
  assignments: PortfolioAssignment[],
  onCreate?: () => void,
  onEdit?: (portfolio: Portfolio) => void,
) {
  const [mode, setMode] = useState<EditorMode>(null)
  const [serverError, setServerError] = useState<string>()
  const createPortfolio = useCreatePortfolio()
  const updatePortfolio = useUpdatePortfolio()

  const openCreate = () => {
    setServerError(undefined)
    setMode({ type: 'create', key: 'create' })
    onCreate?.()
  }

  const openDuplicate = (portfolio: Portfolio) => {
    setServerError(undefined)
    setMode({ type: 'create', initialValue: buildDuplicatePortfolioDraft(portfolio), key: `duplicate-${portfolio.id}` })
    onCreate?.()
  }

  const openEdit = (portfolio: Portfolio) => {
    setServerError(undefined)
    setMode({ type: 'edit', portfolio })
    onEdit?.(portfolio)
  }

  const closeEditor = () => {
    setServerError(undefined)
    setMode(null)
  }

  const submitEditor = (draft: PortfolioDraft) => {
    if (!mode) return
    setServerError(undefined)
    const callbacks = { onSuccess: () => closeEditor(), onError: () => setServerError(portfolioListText.saveFailedError) }
    if (mode.type === 'create') {
      createPortfolio.mutate(draft, callbacks)
      return
    }
    updatePortfolio.mutate({ id: mode.portfolio.id, input: draft }, callbacks)
  }

  const assignedCount = mode?.type === 'edit' ? assignments.filter((a) => a.portfolioId === mode.portfolio.id).length : 0
  const initialValue: PortfolioDraft | undefined =
    mode?.type === 'edit' ? { name: mode.portfolio.name, items: mode.portfolio.items } : mode?.initialValue
  const editorKey = mode?.type === 'edit' ? `edit-${mode.portfolio.id}` : (mode?.key ?? 'create')

  return {
    open: mode !== null,
    editorKey,
    initialValue,
    assignedCount,
    serverError,
    openCreate,
    openDuplicate,
    openEdit,
    closeEditor,
    submitEditor,
  }
}
