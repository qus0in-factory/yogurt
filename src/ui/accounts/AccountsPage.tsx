import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Account } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { readSessionJson, writeSessionJson } from '../lib/session-draft'
import { useUiStore } from '../state/ui-store'
import { AccountCard } from './AccountCard'
import { AddAccountDialog } from './AddAccountDialog'
import { EditAccountDialog } from './EditAccountDialog'
import { useAccounts } from './useAccounts'
import { accountsText } from '../glossary/accounts'

const SCROLL_KEY = 'yogurt:accounts-scroll'

export function AccountsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const { data, isPending, isError, refetch } = useAccounts()
  const accounts = data ?? []
  const selectAccount = useUiStore((s) => s.selectAccount)
  const listRef = useRef<HTMLDivElement | null>(null)
  const restored = useRef(false)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    if (!restored.current) {
      restored.current = true
      const saved = readSessionJson<number>(SCROLL_KEY)
      if (typeof saved === 'number') el.scrollLeft = saved
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => writeSessionJson(SCROLL_KEY, Math.round(el.scrollLeft)), 150)
    }
    el.addEventListener('scroll', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [accounts])

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">{accountsText.title}</h1>
        <Button size="icon" aria-label={accountsText.add} onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      {isPending ? (
        <p className="mt-4 text-stone-600">{accountsText.loading}</p>
      ) : isError ? (
        <div className="mt-4 flex items-center gap-3">
          <p role="alert" className="text-rose-600">{accountsText.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>{accountsText.retry}</Button>
        </div>
      ) : accounts.length === 0 ? (
        <p className="mt-4 text-stone-600">{accountsText.empty}</p>
      ) : (
        <div ref={listRef} tabIndex={0} aria-label={accountsText.listLabel} className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onSelect={() => selectAccount(account.id)}
              onEdit={() => setEditing(account)}
            />
          ))}
        </div>
      )}
      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {editing ? <EditAccountDialog account={editing} onClose={() => setEditing(null)} /> : null}
    </section>
  )
}
