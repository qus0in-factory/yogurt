import { useEffect } from 'react'
import { useAccounts } from '../accounts/useAccounts'
import { useOperationsStore } from '../state/operations-store'
import { useRecentVisitsStore } from '../state/recent-visits'
import { useUiStore } from '../state/ui-store'
import { buildCurrentVisit } from './recent-visit-label'

export function RecentVisitTracker() {
  const screen = useUiStore((state) => state.screen)
  const overviewTab = useUiStore((state) => state.overviewTab)
  const selectedProductIds = useUiStore((state) => state.selectedProductAccountIds)
  const selectedAccountId = useUiStore((state) => state.selectedAccountId)
  const operationsTab = useOperationsStore((state) => state.tab)
  const { data: accounts = [] } = useAccounts()

  useEffect(() => {
    const visit = buildCurrentVisit({
      screen, overviewTab, operationsTab, selectedProductIds, selectedAccountId, accounts,
    })
    if (visit) useRecentVisitsStore.getState().record(visit)
  }, [screen, overviewTab, operationsTab, selectedProductIds, selectedAccountId, accounts])

  return null
}
