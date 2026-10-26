import { useState } from 'react'
import { useCreatePortfolio, useUpdatePortfolio } from '../../../app/portfolio/queries'
import type { PortfolioAssignment } from '../../../domain/portfolio/assignment'
import type { Portfolio, PortfolioDraft } from '../../../domain/portfolio/portfolio'
import { portfolioListText } from '../../glossary/portfolio-list'

type EditorMode = { type: 'create' } | { type: 'edit'; portfolio: Portfolio } | null

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
    setMode({ type: 'create' })
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
    const callbacks = {
      onSuccess: () => closeEditor(),
      onError: () => setServerError(portfolioListText.saveFailedError),
    }
    if (mode.type === 'create') {
      createPortfolio.mutate(draft, callbacks)
      return
    }
    updatePortfolio.mutate({ id: mode.portfolio.id, input: draft }, callbacks)
  }

  const editingPortfolio = mode?.type === 'edit' ? mode.portfolio : undefined
  const assignedCount = editingPortfolio
    ? assignments.filter((a) => a.portfolioId === editingPortfolio.id).length
    : 0
  const initialValue: PortfolioDraft | undefined = editingPortfolio
    ? { name: editingPortfolio.name, items: editingPortfolio.items }
    : undefined
  const editorKey = editingPortfolio ? `edit-${editingPortfolio.id}` : 'create'

  return {
    open: mode !== null,
    editorKey,
    initialValue,
    assignedCount,
    serverError,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
  }
}
