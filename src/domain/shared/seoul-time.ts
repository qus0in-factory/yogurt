const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000
const AS_OF = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/

export function seoulDate(now: Date): string {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

export function seoulDateTime(now: Date): string {
  return new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 16).replace('T', ' ')
}

export function isSeoulMinuteShape(value: string): boolean {
  return AS_OF.test(value)
}
