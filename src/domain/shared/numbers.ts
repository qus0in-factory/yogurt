export function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}
export function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
export function round2(value: number): number {
  return Math.round(value * 100) / 100
}
export function percentOfRounded(amount: number, total: number): number {
  return total === 0 ? 0 : Math.round(amount / total * 10000) / 100
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
export function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step
}
export function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step
}
