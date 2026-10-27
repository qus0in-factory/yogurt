import { format, isValid } from 'date-fns'
import { TZDate } from '@date-fns/tz'

export function formatNextOpenTime(iso: string): string {
  try {
    const date = new TZDate(iso, 'Asia/Seoul')
    if (!isValid(date)) return iso
    return format(date, 'yyyy.MM.dd HH:mm')
  } catch {
    return iso
  }
}
