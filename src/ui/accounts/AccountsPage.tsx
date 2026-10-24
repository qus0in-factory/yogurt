import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { readSessionJson, writeSessionJson } from '../lib/session-draft'
import { useUiStore } from '../state/ui-store'
import { AddAccountDialog } from './AddAccountDialog'
import { useAccounts } from './useAccounts'

const SCROLL_KEY = 'yogurt:accounts-scroll'

export function AccountsPage() {
  const [addOpen, setAddOpen] = useState(false)
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
        <h1 className="text-2xl font-semibold text-stone-900">계좌</h1>
        <Button size="icon" aria-label="계좌 추가" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      {isPending ? (
        <p className="mt-4 text-stone-600">불러오는 중…</p>
      ) : isError ? (
        <div className="mt-4 flex items-center gap-3">
          <p role="alert" className="text-rose-600">계좌를 불러오지 못했습니다</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>다시 시도</Button>
        </div>
      ) : accounts.length === 0 ? (
        <p className="mt-4 text-stone-600">등록된 계좌가 없습니다</p>
      ) : (
        <div ref={listRef} tabIndex={0} aria-label="계좌 목록" className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto">
          {accounts.map((account) => (
            <div
              key={account.id}
              role="group"
              tabIndex={0}
              aria-roledescription="카드"
              aria-label={account.alias}
              onClick={() => selectAccount(account.id)}
              onFocus={() => selectAccount(account.id)}
              className="w-full shrink-0 snap-center rounded-lg border border-primary-200 bg-white p-6 shadow-sm"
            >
              <p className="text-lg font-semibold text-stone-900">{account.alias}</p>
              <p className="mt-1 text-sm text-stone-600">{account.accountNumber}</p>
            </div>
          ))}
        </div>
      )}
      <AddAccountDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </section>
  )
}
