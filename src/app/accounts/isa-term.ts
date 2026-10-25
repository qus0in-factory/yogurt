import { TZDate } from '@date-fns/tz'
import { addYears, differenceInCalendarDays, format } from 'date-fns'

const SEOUL = 'Asia/Seoul'

export type IsaTermStatus = 'active' | 'expiringSoon' | 'expired'

function seoulDate(value: string): TZDate {
  return new TZDate(`${value}T00:00:00+09:00`, SEOUL)
}

export function isaExpiry(startDate: string): string {
  return format(addYears(seoulDate(startDate), 3), 'yyyy-MM-dd')
}

export function daysUntil(expiry: string, today: string): number {
  return differenceInCalendarDays(seoulDate(expiry), seoulDate(today))
}

export function isaStatus(daysLeft: number): IsaTermStatus {
  if (daysLeft < 0) return 'expired'
  return daysLeft <= 90 ? 'expiringSoon' : 'active'
}

export function seoulToday(): string {
  return format(new TZDate(Date.now(), SEOUL), 'yyyy-MM-dd')
}

export function safeIsaExpiry(startDate: string): string | null {
  try {
    const date = new Date(`${startDate}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== startDate) return null
    return isaExpiry(startDate)
  } catch {
    return null
  }
}

export function isaTerm(startDate: string, today: string) {
  const expiry = isaExpiry(startDate)
  const daysLeft = daysUntil(expiry, today)
  return { expiry, daysLeft, status: isaStatus(daysLeft) }
}

export function isaK(startDate: string, targetDateOrMonth: string): number {
  const [sY, sM] = startDate.split('-').map(Number)
  const [tY, tM] = targetDateOrMonth.split('-').map(Number)
  if (!sY || !sM || !tY || !tM) return 0
  const diff = (tY - sY) * 12 + (tM - sM)
  if (diff < 0) return 0
  return Math.min(36, diff + 1)
}
