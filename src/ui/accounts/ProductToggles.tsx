import { productIcons } from '../overview/product-icons'
import { toast } from 'sonner'
import type { Account } from '../../domain/accounts/account'
import { ACCOUNT_PRODUCTS } from '../../domain/accounts/products'
import { Button } from '../components/Button'
import { accountsText } from '../glossary/accounts'
import { useSetAccountProduct } from './useAccounts'

export function ProductToggles({ account }: { account: Account }) {
  const mutation = useSetAccountProduct()
  return <div className="flex flex-wrap gap-2" onFocus={event => event.stopPropagation()}>
    {ACCOUNT_PRODUCTS.map(product => {
      const enabled = account.products.includes(product.code)
      const Icon = productIcons[product.key]
      return <Button key={product.code} size="sm" variant={enabled ? 'default' : 'outline'}
        aria-pressed={enabled} disabled={mutation.isPending} className="gap-2"
        onClick={event => {
          event.stopPropagation()
          mutation.mutate({ id: account.id, code: product.code, enabled: !enabled }, {
            onError: () => toast.error(accountsText.productFailed),
          })
        }}>
        <Icon aria-hidden="true" className="h-4 w-4" />{product.label}
      </Button>
    })}
  </div>
}
