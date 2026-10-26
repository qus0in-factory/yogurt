export const SEVEN_DAYS_MS = 7 * 86400000

export function isFreshSeoulMinute(asOf: string, now: Date, maxAgeMs: number): boolean {
  const saved = Date.parse(`${asOf.replace(' ', 'T')}:00+09:00`)
  if (!Number.isFinite(saved)) return false
  const age = now.getTime() - saved
  return age >= 0 && age <= maxAgeMs
}
