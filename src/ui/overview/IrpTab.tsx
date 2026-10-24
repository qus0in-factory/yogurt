import { irpAccounts } from '../../app/overview/irp-accounts'
import { useAccounts } from '../accounts/useAccounts'
import { accountsText } from '../glossary/accounts'
import { overviewText } from '../glossary/overview'

export function IrpTab() {
  const { data, isPending } = useAccounts()
  if (isPending) return <p className="text-stone-600">{accountsText.loading}</p>
  const accounts = irpAccounts(data ?? [])
  return (
    <div className="flex flex-col gap-2">
      <p className="text-stone-600">{overviewText.total(accounts.length)}</p>
      {accounts.length === 0 ? (
        <p className="text-stone-600">{overviewText.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((account) => (
            <li key={account.id} className="flex flex-col gap-1 rounded-lg border border-primary-200 bg-white p-4">
              <p className="text-sm text-stone-600">{account.owner}</p>
              <p className="text-lg font-semibold text-stone-900">{account.alias}</p>
              <p className="text-sm text-stone-600">{account.accountNumber}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
