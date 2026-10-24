import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button'
import { AddAccountDialog } from './AddAccountDialog'
import { useAccounts } from './useAccounts'

export function AccountsPage() {
  const [addOpen, setAddOpen] = useState(false)
  const { data, isPending, isError, refetch } = useAccounts()
  const accounts = data ?? []

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
        <div tabIndex={0} aria-label="계좌 목록" className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto">
          {accounts.map((account) => (
            <div
              key={account.id}
              role="group"
              aria-roledescription="카드"
              aria-label={account.alias}
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
