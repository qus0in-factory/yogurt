import type { Account } from '../../domain/accounts/account'

export function irpAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.productCode === '29')
}
