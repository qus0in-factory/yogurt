import { irpAccounts } from '../../app/overview/irp-accounts'
import { useAccounts } from '../accounts/useAccounts'
import { Carousel } from '../components/Carousel'
import { accountsText } from '../glossary/accounts'
import { overviewText } from '../glossary/overview'
import { useUiStore } from '../state/ui-store'
import { IrpDetail } from './IrpDetail'
import { IrpAccountBox } from './IrpAccountBox'

const labels = { list: overviewText.listLabel, previous: accountsText.previous, next: accountsText.next, goTo: accountsText.goTo, position: accountsText.position }

export function IrpTab() {
  const { data, isPending } = useAccounts()
  const selectedId = useUiStore(state => state.selectedIrpAccountId)
  const select = useUiStore(state => state.selectIrpAccount)
  if (isPending) return <p className="text-stone-600">{accountsText.loading}</p>
  const accounts = irpAccounts(data ?? [])
  return (
    <div className="flex flex-col gap-2">
      <p className="text-stone-600">{overviewText.total(accounts.length)}</p>
      {accounts.length === 0 ? (
        <p className="text-stone-600">{overviewText.empty}</p>
      ) : (
        <Carousel items={accounts} labels={labels} renderItem={(account) => <IrpAccountBox key={account.id} account={account}
          selected={selectedId === account.id} onSelect={() => select(selectedId === account.id ? null : account.id)} />} />
      )}
      {selectedId && accounts.some(account => account.id === selectedId) && <IrpDetail key={selectedId} accountId={selectedId} />}
    </div>
  )
}
