import type { Account } from '../../domain/accounts/account'
import { Sensitive } from '../components/Sensitive'
import { typeScale } from '../styles/type-scale'

type Props = { account: Account; selected?: boolean; onSelect?: () => void }

export function IrpAccountBox({ account, selected = false, onSelect }: Props) {
  return (
    <button type="button" aria-pressed={selected} onClick={onSelect}
      aria-label={`${account.owner} ${account.alias} ${account.accountNumber}`}
      className={`flex w-full flex-col gap-2 rounded-lg border p-4 text-left focus-visible:ring-2 focus-visible:ring-primary-500 ${selected ? 'border-primary-500 bg-primary-50' : 'border-primary-200 bg-white'}`}>
      <Sensitive className={`${typeScale.caption} md:text-sm md:leading-5 md:text-stone-600`}>{account.owner}</Sensitive>
      <span className={`${typeScale.title} md:text-lg`}>{account.alias}</span>
      <Sensitive className={`${typeScale.caption} md:text-sm md:leading-5 md:text-stone-600`}>{account.accountNumber}</Sensitive>
    </button>
  )
}
