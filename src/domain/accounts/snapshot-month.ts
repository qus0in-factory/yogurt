const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

export function seoulDate(now: Date): string {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

export function seoulYearMonth(now: Date): string {
  return seoulDate(now).slice(0, 7)
}

const START_DATE = /^(\d{4})-(\d{2})-\d{2}$/

export function isaExpiryMonth(startDate: string | null): string | null {
  const match = startDate ? START_DATE.exec(startDate) : null
  return match ? `${Number(match[1]) + 3}-${match[2]}` : null
}

export function shouldRecordSnapshotMonth(yearMonth: string, startDate: string | null): boolean {
  const expiryMonth = isaExpiryMonth(startDate)
  return expiryMonth === null || yearMonth < expiryMonth
}
