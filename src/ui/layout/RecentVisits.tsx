import { useCallback, useContext, useSyncExternalStore } from 'react'
import { QueryClientContext } from '@tanstack/react-query'
import type { Account } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { Sensitive } from '../components/Sensitive'
import { layoutText } from '../glossary/layout'
import { useOperationsStore, type OperationsTab } from '../state/operations-store'
import { useRecentVisitsStore, type RecentVisit } from '../state/recent-visits'
import { useUiStore, type OverviewTab } from '../state/ui-store'
import { queryClient } from '../state/query-client'
import { typeScale } from '../styles/type-scale'
import { cn } from '../lib/cn'
import type { ScreenId } from './menu'

type Props = { current: ScreenId; onNavigate: (id: ScreenId) => void; onClose?: () => void }

const EMPTY_ACCOUNTS: Account[] = []
const keyOf = (visit: RecentVisit) => `${visit.screen}|${visit.tab ?? ''}|${visit.accountId ?? ''}`
const useCachedAccounts = () => {
  const client = useContext(QueryClientContext) ?? queryClient
  const subscribe = useCallback((onChange: () => void) => client.getQueryCache().subscribe(onChange), [client])
  const snapshot = useCallback(() => client.getQueryData<Account[]>(['accounts']) ?? EMPTY_ACCOUNTS, [client])
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

export function RecentVisits({ current, onNavigate, onClose }: Props) {
  const visits = useRecentVisitsStore((state) => state.visits)
  const { overviewTab, setOverviewTab, selectedProductAccountIds, selectProductAccount, selectedAccountId, selectAccount } = useUiStore()
  const { tab: operationsTab, setTab: setOperationsTab } = useOperationsStore()
  const accounts = useCachedAccounts()
  const items: Array<{ visit: RecentVisit; account?: Account }> = visits.flatMap((visit) => {
    if (!visit.accountId) return [{ visit }]
    const account = accounts.find((item) => item.id === visit.accountId)
    return account ? [{ visit, account }] : []
  })
  if (items.length === 0) return null

  const currentKey = current === 'overview'
    ? `overview|${overviewTab}|${selectedProductAccountIds[overviewTab] ?? ''}`
    : current === 'operations' ? `operations|${operationsTab}|` : `accounts||${selectedAccountId ?? ''}`
  const go = (visit: RecentVisit) => {
    if (visit.screen === 'overview' && visit.tab) {
      setOverviewTab(visit.tab as OverviewTab)
      selectProductAccount(visit.tab, visit.accountId ?? null)
    } else if (visit.screen === 'operations' && visit.tab) {
      setOperationsTab(visit.tab as OperationsTab)
    } else if (visit.screen === 'accounts') {
      selectAccount(visit.accountId ?? null)
    }
    useRecentVisitsStore.getState().record(visit)
    onNavigate(visit.screen)
    onClose?.()
  }
  return (
    <div className="mt-1 flex flex-col gap-1">
      <p className={cn(typeScale.caption, 'px-3')}>{layoutText.recentVisits}</p>
      <ul aria-label={layoutText.recentVisits} className="flex flex-col gap-1">
        {items.map(({ visit, account }) => {
          const detail = account && visit.screen !== 'accounts'
            ? (visit.label.includes(' · ') ? visit.label.split(' · ').slice(1).join(' · ') : visit.label)
            : ''
          const active = keyOf(visit) === currentKey
          return (
            <li key={keyOf(visit)}>
              <Button variant={active ? 'default' : 'ghost'} className="min-h-11 w-full justify-start px-3 py-2 text-left" aria-current={active ? 'page' : undefined} onClick={() => go(visit)}>
                {account ? <><Sensitive>{account.accountNumber}</Sensitive>{detail ? <>{' · '}<span>{detail}</span></> : null}</> : visit.label}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
