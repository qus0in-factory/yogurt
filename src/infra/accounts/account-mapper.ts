import type { Account } from '../../domain/accounts/account.ts'

export type AccountRow = { id: string; alias: string; owner: string; account_number: string; created_at: string }
export type ProductRow = {
  product_code: string
  start_date: string | null
  min_target_amount_won?: number | null
  max_target_amount_won?: number | null
}

export function toAccount(row: AccountRow, products: ProductRow[]): Account {
  return {
    id: row.id, alias: row.alias, owner: row.owner, accountNumber: row.account_number,
    products: products.map((product) => product.product_code),
    productPlans: Object.fromEntries(products.filter((product) => product.start_date)
      .map((product) => [product.product_code, {
        startDate: product.start_date as string,
        minTargetAmountWon: product.min_target_amount_won ?? null,
        maxTargetAmountWon: product.max_target_amount_won ?? null,
      }])),
    createdAt: row.created_at,
  }
}
