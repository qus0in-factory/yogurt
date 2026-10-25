const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const PROGRESS_WINDOW_HALF_SPAN_DESKTOP = 3
export const PROGRESS_WINDOW_HALF_SPAN_MOBILE = 1
export const PROGRESS_WINDOW_HALF_SPAN = PROGRESS_WINDOW_HALF_SPAN_DESKTOP

export function addMonths(monthStr: string, offset: number): string {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + offset, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function generateProgressWindowMonths(
  todayStr: string,
  startDateStr?: string,
  expiryStr?: string,
  halfSpan: number = PROGRESS_WINDOW_HALF_SPAN_DESKTOP,
): string[] {
  const curMonth = todayStr.slice(0, 7)
  const startMonth = startDateStr ? startDateStr.slice(0, 7) : null
  const expiryMonth = expiryStr ? expiryStr.slice(0, 7) : null
  const result: string[] = []
  for (let i = -halfSpan; i <= halfSpan; i++) {
    const m = addMonths(curMonth, i)
    if (startMonth && m < startMonth) continue
    if (expiryMonth && m > expiryMonth) continue
    result.push(m)
  }
  return result
}

export function generateProgressMonths(todayStr: string, expiryStr: string): string[] {
  if (!DATE_PATTERN.test(todayStr) || !DATE_PATTERN.test(expiryStr)) return []
  if (todayStr > expiryStr) return []
  const [tY, tM] = todayStr.split('-').map(Number)
  const [eY, eM] = expiryStr.split('-').map(Number)
  if (!tY || !tM || !eY || !eM) return []
  const result: string[] = []
  let y = tY, m = tM
  while (y < eY || (y === eY && m <= eM)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) { y += 1; m = 1 }
  }
  return result
}
