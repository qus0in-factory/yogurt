import { format, isValid } from 'date-fns'
import { TZDate } from '@date-fns/tz'

const krwFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

export function formatKRW(amount: number): string {
  return krwFormatter.format(amount)
}

export function formatDate(isoDate: string): string {
  try {
    const date = new TZDate(isoDate, 'Asia/Seoul')
    if (!isValid(date)) return ''
    return format(date, 'yyyy.MM.dd')
  } catch {
    return ''
  }
}
