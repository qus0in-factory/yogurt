import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Account } from '../../domain/accounts/account'
import { filterAccounts } from '../../app/accounts/filter-accounts'
import { Button } from '../components/Button'
import { readSessionJson, writeSessionJson } from '../lib/session-draft'
import { AddAccountDialog } from './AddAccountDialog'
import { EditAccountDialog } from './EditAccountDialog'
import { AccountCarousel } from './AccountCarousel'
import { AccountSearch } from './AccountSearch'
import { useAccounts } from './useAccounts'
import { useKisStatus } from './useKisStatus'
import { accountsText } from '../glossary/accounts'
import { spacing, typeScale } from '../styles/type-scale'

const QUERY_KEY = 'yogurt:accounts-query'

export function AccountsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [query, setQuery] = useState(() => {
    const saved = readSessionJson<unknown>(QUERY_KEY)
    return typeof saved === 'string' ? saved : ''
  })
  useEffect(() => {
    sessionStorage.removeItem('yogurt:accounts-scroll')
    sessionStorage.removeItem('yogurt:accounts-index')
  }, [])
  const { data, isPending, isError, refetch } = useAccounts()
  const kisStatuses = useKisStatus()
  const accounts = data ?? []
  const filtered = filterAccounts(accounts, query)
  const search = (value: string) => {
    setQuery(value)
    writeSessionJson(QUERY_KEY, value)
    writeSessionJson('yogurt:accounts-page', 0)
  }

  return (
    <section aria-labelledby="accounts-title" className={spacing.section}>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 id="accounts-title" className={typeScale.pageTitle}>{accountsText.title}</h1>
          {!isPending && !isError && <span className={typeScale.number}>{accountsText.total(accounts.length)}</span>}
        </div>
        <Button size="icon" aria-label={accountsText.add} onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      {!isPending && !isError && <AccountSearch query={query} total={accounts.length} matched={filtered.length} onChange={search} />}
      {isPending ? (
        <p className={typeScale.body}>{accountsText.loading}</p>
      ) : isError ? (
        <div className="flex items-center gap-3">
          <p role="alert" className="text-rose-600">{accountsText.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>{accountsText.retry}</Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className={typeScale.body}>{query.replace(/\s/g, '') ? accountsText.noResults : accountsText.empty}</p>
      ) : <AccountCarousel key={query} accounts={filtered} onEdit={setEditing} kisStatuses={kisStatuses} />}
      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {editing ? <EditAccountDialog account={editing} onClose={() => setEditing(null)} /> : null}
    </section>
  )
}
