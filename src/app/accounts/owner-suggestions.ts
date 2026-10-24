import type { Account } from '../../domain/accounts/account'

export function ownerSuggestions(accounts: Account[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  const sorted = [...accounts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  for (const account of sorted) {
    const owner = account.owner.trim()
    if (owner === '' || seen.has(owner)) continue
    seen.add(owner)
    result.push(owner)
  }
  return result
}
