import type { Account } from '../../domain/accounts/account'

const normalize = (value: string) => value.replace(/\s/g, '').toLowerCase()

export function filterAccounts(accounts: readonly Account[], query: string): Account[] {
  const term = normalize(query)
  return accounts.filter(account => [account.alias, account.owner].some(value => normalize(value).includes(term)))
}
