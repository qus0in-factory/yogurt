import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { CircleAlert, Link2, LoaderCircle, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { ProductToggles } from './ProductToggles'
import { useKisToken } from './useKisToken'
import type { Account } from '../../domain/accounts/account'
import type { KisStatusInfo } from './useKisStatus'
import { Button } from '../components/Button'
import { accountsText } from '../glossary/accounts'

type AccountCardProps = { account: Account; onSelect: () => void; onEdit: () => void; kisStatus?: KisStatusInfo }

const badgeText = (kisStatus: KisStatusInfo | undefined) => {
  if (!kisStatus) return accountsText.kisChecking
  if (kisStatus.status === 'error') return accountsText.kisError
  if (kisStatus.expiresAt === undefined) return accountsText.kisConnected
  return accountsText.kisConnectedExpiry(format(new TZDate(kisStatus.expiresAt, 'Asia/Seoul'), 'HH:mm'))
}

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
  const Icon = !kisStatus ? LoaderCircle : kisStatus.status === 'error' ? CircleAlert : Link2
  const className = kisStatus?.status === 'error' ? 'text-red-600' : 'text-stone-600'
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
        <p className="text-sm text-stone-600">{account.accountNumber}</p>
        <span data-testid="kis-status" role="status" className={`flex items-center gap-2 text-sm ${className}`}>
          <Icon aria-hidden="true" className="h-4 w-4" />
          {badgeText(kisStatus)}
        </span>
        <ProductToggles account={account} />
        <Button size="sm" variant="outline" className="w-full gap-2" disabled={kisToken.isPending}
          onClick={(event) => { event.stopPropagation(); checkKis() }}>
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
