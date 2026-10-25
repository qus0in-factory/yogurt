import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { Link2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Account } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { accountsText } from '../glossary/accounts'
import { useKisToken } from './useKisToken'

type AccountCardProps = { account: Account; onSelect: () => void; onEdit: () => void }

export function AccountCard({ account, onSelect, onEdit }: AccountCardProps) {
  const kisToken = useKisToken()
  const checkKis = () => {
    kisToken.mutate(account.id, {
      onSuccess: (result) => {
        const expires = format(new TZDate(result.expiresAt, 'Asia/Seoul'), 'HH:mm')
        toast(result.issued ? accountsText.kisIssued : accountsText.kisExisting(expires))
      },
      onError: () => toast.error(accountsText.kisFailed),
    })
  }
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
      <div className="flex flex-col gap-2 pr-10">
        <p className="text-sm text-stone-600">{account.owner}</p>
        <p className="text-xl font-semibold text-stone-900">{account.alias}</p>
        <p className="text-sm text-stone-600">{accountsText.numberWithCode(account.accountNumber, account.productCode)}</p>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={kisToken.isPending}
          onClick={(event) => { event.stopPropagation(); checkKis() }}
        >
          <Link2 aria-hidden="true" className="h-4 w-4" />
          {accountsText.kisCheck}
        </Button>
      </div>
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
