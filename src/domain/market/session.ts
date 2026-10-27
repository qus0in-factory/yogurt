const KST_OFFSET = 9 * 60 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

export type MarketStatus = {
  open: boolean
  reason: 'open' | 'closed-hours' | 'weekend' | 'holiday'
  nextOpenAt: string
}

function closure(day: Date, holidays: Set<string>): 'weekend' | 'holiday' | undefined {
  if (day.getUTCDay() === 0 || day.getUTCDay() === 6) return 'weekend'
  if (holidays.has(day.toISOString().slice(0, 10))) return 'holiday'
}

// Asia/Seoul uses UTC+09:00; UTC accessors keep this independent of server timezone.
export function isMarketOpen(now: Date, holidays: string[]): MarketStatus {
  const local = new Date(now.getTime() + KST_OFFSET)
  const holidaySet = new Set(holidays)
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes()
  const reason = closure(local, holidaySet)
    ?? (minutes >= 540 && minutes < 930 ? 'open' : 'closed-hours')
  const next = new Date(local)
  next.setUTCHours(9, 0, 0, 0)
  // During an active session, return the next session's opening, strictly after now.
  if (next.getTime() <= local.getTime()) next.setTime(next.getTime() + DAY)
  while (closure(next, holidaySet)) next.setTime(next.getTime() + DAY)
  return {
    open: reason === 'open', reason,
    nextOpenAt: new Date(next.getTime() - KST_OFFSET).toISOString(),
  }
}
