const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000

export function seoulDate(now: Date): string {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

export function seoulYearMonth(now: Date): string {
  return seoulDate(now).slice(0, 7)
}

export function seoulDateTime(now: Date): string {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ')
}

export function previousMonthEnd(now: Date): string {
  const [year, month] = seoulDate(now).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10)
}

export function daysBefore(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() - days)
  return value.toISOString().slice(0, 10)
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
