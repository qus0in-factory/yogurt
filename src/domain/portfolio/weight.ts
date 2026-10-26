const PERCENT_PATTERN = /^(\d{1,3})(?:\.(\d{1,2}))?$/

export const MAX_WEIGHT_BPS = 10000

export function parsePercentToBps(value: string): number | null {
  const text = value.trim()
  if (!PERCENT_PATTERN.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (bps < 1 || bps > MAX_WEIGHT_BPS) return null
  return bps
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`
}

export function formatBpsLabel(bps: number): string {
  return `${formatBps(bps)}`
}
