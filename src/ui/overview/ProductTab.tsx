import { ACCOUNT_PRODUCTS } from '../../domain/accounts/products'
import { productAccounts } from '../../app/overview/product-accounts'
import { useAccounts } from '../accounts/useAccounts'
import { Carousel } from '../components/Carousel'
import { accountsText } from '../glossary/accounts'
import { overviewText } from '../glossary/overview'
import { useUiStore } from '../state/ui-store'
import { IrpDetail } from './IrpDetail'
import { IrpAccountBox } from './IrpAccountBox'

export function ProductTab({ productCode }: { productCode: string }) {
  const product = ACCOUNT_PRODUCTS.find((p) => p.code === productCode) ?? ACCOUNT_PRODUCTS[0]
  const { data, isPending } = useAccounts()
  const selectedId = useUiStore((state) => state.selectedProductAccountIds[product.key] ?? null)
  const select = useUiStore((state) => state.selectProductAccount)
  if (isPending) return <p className="text-stone-600">{accountsText.loading}</p>
  const accounts = productAccounts(data ?? [], productCode)
  const labels = { list: overviewText.productListLabel(product.label), previous: accountsText.previous, next: accountsText.next, goTo: accountsText.goTo, position: accountsText.position }
  const isSelected = Boolean(selectedId && accounts.some((account) => account.id === selectedId))

  return (
    <div className="flex flex-col gap-2">
      <p className="text-stone-600">{overviewText.total(accounts.length)}</p>
      {accounts.length === 0 ? (
        <p className="text-stone-600">{overviewText.productEmpty(product.label)}</p>
      ) : (
        <Carousel items={accounts} labels={labels} renderItem={(account) => <IrpAccountBox key={account.id} account={account}
          selected={selectedId === account.id} onSelect={() => select(product.key, selectedId === account.id ? null : account.id)} />} />
      )}
      {isSelected && (product.key === 'irp' ? <IrpDetail key={selectedId} accountId={selectedId!} /> : <p className="text-stone-600">{overviewText.pensionDetailComingSoon}</p>)}
    </div>
  )
}
