export type RebalanceCheckFailure = { stage?: string; kisCode?: string; kisMessage?: string }

export const checkFailureData = (err: unknown): Record<string, unknown> | null => {
  if (!err || typeof err !== 'object') return null
  const record = err as Record<string, unknown>
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return record.data as Record<string, unknown>
  }
  return record
}