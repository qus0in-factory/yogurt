import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { Check, LoaderCircle, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { ProductToggles } from './ProductToggles'
import { useKisToken } from './useKisToken'
import type { Account } from '../../domain/accounts/account'
import type { KisStatusInfo } from './useKisStatus'
import { Button } from '../components/Button'
import { accountsText } from '../glossary/accounts'

type AccountCardProps = { account: Account; onSelect: () => void; onEdit: () => void; kisStatus?: KisStatusInfo }

export function AccountCard({ account, onSelect, onEdit, kisStatus }: AccountCardProps) {
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
  const isChecking = !kisStatus || kisToken.isPending
  const isError = kisStatus?.status === 'error'
  const Icon = isChecking ? LoaderCircle : isError ? X : Check
  const iconClass = isChecking ? 'text-stone-400' : isError ? 'text-red-600' : 'text-green-600'
  const ariaLabel = isChecking
    ? accountsText.kisStatusChecking
    : isError
      ? accountsText.kisStatusFailed
      : kisStatus?.expiresAt === undefined
        ? accountsText.kisConnectedExpiry('--:--')
        : accountsText.kisConnectedExpiry(format(new TZDate(kisStatus.expiresAt, 'Asia/Seoul'), 'HH:mm'))
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
      <div className="flex flex-col gap-2 pr-20">
        <p className="text-sm text-stone-600">{account.owner}</p>
        <p className="text-xl font-semibold text-stone-900">{account.alias}</p>
        <p className="text-sm text-stone-600">{account.accountNumber}</p>
        <ProductToggles account={account} />
      </div>
      <div className="absolute right-2 top-2 flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          aria-label={ariaLabel}
          title={ariaLabel}
          disabled={kisToken.isPending}
          onClick={(event) => {
            event.stopPropagation()
            checkKis()
          }}
        >
          <Icon aria-hidden="true" className={`h-4 w-4 ${iconClass} ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={accountsText.editLabel(account.alias)}
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
