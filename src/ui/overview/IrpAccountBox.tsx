import type { Account } from '../../domain/accounts/account'

export function IrpAccountBox({ account }: { account: Account }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-primary-200 bg-white p-4">
      <p className="text-sm text-stone-600">{account.owner}</p>
      <p className="text-lg font-semibold text-stone-900">{account.alias}</p>
      <p className="text-sm text-stone-600">{account.accountNumber}</p>
    </div>
  )
}
