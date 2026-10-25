import type { Account } from '../../domain/accounts/account'

export function productAccounts(accounts: Account[], productCode: string): Account[] {
  return accounts.filter((account) => account.products.includes(productCode))
}
