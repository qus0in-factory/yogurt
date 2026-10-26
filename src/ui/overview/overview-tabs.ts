import { ACCOUNT_PRODUCTS, type ProductKey } from '../../domain/accounts/products'

export type OverviewTabItem = {
  key: ProductKey
  label: string
  code: string
}

export const OVERVIEW_TAB_ITEMS: readonly OverviewTabItem[] = ACCOUNT_PRODUCTS.map((product) => ({
  key: product.key,
  label: product.label,
  code: product.code,
}))
