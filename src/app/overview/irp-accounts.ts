import type { Account } from '../../domain/accounts/account'

export function irpAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.alias.toLowerCase().includes('irp'))
}
