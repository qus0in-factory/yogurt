const PREFIX = 'isa-snapshot:'
const EXPIRATION_TTL_SECONDS = 15552000

export function isaSnapshotKey(accountId: string, date: string): string {
  return `${PREFIX}${accountId}:${date}`
}

export async function saveIsaSnapshot(cache: KVNamespace, input: {
  accountId: string
  date: string
  totalAssetsWon: number
  recordedAt: string
}): Promise<void> {
  const key = isaSnapshotKey(input.accountId, input.date)
  const value = JSON.stringify({ totalAssetsWon: input.totalAssetsWon, recordedAt: input.recordedAt })
  await cache.put(key, value, { expirationTtl: EXPIRATION_TTL_SECONDS })
}
