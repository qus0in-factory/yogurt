import { useCallback } from 'react'
import type { Account } from '../../domain/accounts/account'
import { Carousel } from '../components/Carousel'
import { accountsText } from '../glossary/accounts'
import { useUiStore } from '../state/ui-store'
import { AccountCard } from './AccountCard'
import type { KisStatuses } from './useKisStatus'

type Props = { accounts: Account[]; onEdit: (account: Account) => void; kisStatuses?: KisStatuses }
const PAGE_KEY = 'yogurt:accounts-page'
const labels = { list: accountsText.listLabel, previous: accountsText.previous, next: accountsText.next, goTo: accountsText.goTo, position: accountsText.position }

export function AccountCarousel({ accounts, onEdit, kisStatuses = new Map() }: Props) {
  const selectAccount = useUiStore((state) => state.selectAccount)
  const change = useCallback((page: number, pageSize: number) => {
    sessionStorage.removeItem('yogurt:accounts-index')
    sessionStorage.removeItem('yogurt:accounts-scroll')
    if (accounts[page * pageSize]) selectAccount(accounts[page * pageSize].id)
  }, [accounts, selectAccount])
  return (
    <Carousel items={accounts} labels={labels} pageKey={PAGE_KEY} onPageChange={change}
      renderItem={(account) => (
        <AccountCard key={account.id} account={account} onSelect={() => selectAccount(account.id)} onEdit={() => onEdit(account)} kisStatus={kisStatuses.get(account.id)} />
      )} />
  )
}
