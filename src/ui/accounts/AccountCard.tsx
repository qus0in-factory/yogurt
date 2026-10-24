import { Pencil } from 'lucide-react'
import type { Account } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { accountsText } from '../glossary/accounts'

type AccountCardProps = { account: Account; onSelect: () => void; onEdit: () => void }

export function AccountCard({ account, onSelect, onEdit }: AccountCardProps) {
  return (
    <div
      role="group"
      tabIndex={0}
      aria-roledescription={accountsText.card}
      aria-label={account.alias}
      onClick={onSelect}
      onFocus={onSelect}
      className="relative w-full shrink-0 rounded-lg border border-primary-200 bg-white p-6 shadow-sm"
    >
      <p className="pr-10 text-sm text-stone-600">{account.owner}</p>
      <p className="mt-1 pr-10 text-xl font-semibold text-stone-900">{account.alias}</p>
      <p className="mt-1 text-sm text-stone-600">{account.accountNumber}</p>
      <Button
        size="icon"
        variant="ghost"
        aria-label={accountsText.editLabel(account.alias)}
        className="absolute right-2 top-2"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  )
}
