import { useState } from 'react'
import { useKeepAmount, useSaveKeepAmount } from '../../../app/rebalance/queries'

type SavedKeepAmount = {
  keepAmount: number; isLoading: boolean; isLoadError: boolean; isSaving: boolean; isError: boolean
  savedKeepVersion?: number; lastSavedKeepAmount?: number | null
  keepUpdatedAt?: number; isKeepFetching?: boolean
  saveKeepAmount: (keepAmount: number) => void
  refetchKeepAmount?: () => void
}

export function useSavedKeepAmount(accountId: string, productCode: string): SavedKeepAmount {
  const query = useKeepAmount(accountId, productCode)
  const save = useSaveKeepAmount(accountId, productCode)
  const [savedKeepVersion, setSavedKeepVersion] = useState(0)
  const [lastSavedKeepAmount, setLastSavedKeepAmount] = useState<number | null>(null)
  const [lastSaveError, setLastSaveError] = useState(false)
  return {
    keepAmount: query.data?.keepAmount ?? 0,
    isLoading: query.isLoading,
    isLoadError: query.isError,
    isSaving: save.isPending,
    isError: save.isError || lastSaveError,
    savedKeepVersion, lastSavedKeepAmount,
    keepUpdatedAt: query.dataUpdatedAt, isKeepFetching: query.isFetching,
    saveKeepAmount: (keepAmount: number) => save.mutate(keepAmount, {
      onError: () => setLastSaveError(true),
      onSuccess: (data) => { setLastSaveError(false); setLastSavedKeepAmount(data.keepAmount); setSavedKeepVersion((v) => v + 1) },
    }),
    refetchKeepAmount: () => { void query.refetch() },
  }
}
