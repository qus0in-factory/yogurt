export type IsaPositionStatus = 'below' | 'within' | 'above'

export interface IsaPositionInput {
  currentAssets: number
  minTarget: number | null
  maxTarget: number | null
}

export interface IsaPositionResult {
  isValid: boolean
  rangePosition: number | null
  minAchievement: number | null
  maxAchievement: number | null
  midTarget: number | null
  isEqualTarget: boolean
  status: IsaPositionStatus | null
  minZero: boolean
  maxZero: boolean
}

export function formatPercent(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null
  const rounded = Math.round(Math.abs(value) * 10) / 10
  const norm = Object.is(rounded, -0) ? 0 : rounded
  const sign = value < 0 && norm !== 0 ? '-' : ''
  return `${sign}${norm.toFixed(1)}%`
}

export function calculateIsaPosition(input: IsaPositionInput): IsaPositionResult {
  const { currentAssets: a, minTarget: l, maxTarget: u } = input
  if (!Number.isFinite(a) || (l !== null && (!Number.isFinite(l) || l < 0)) || (u !== null && (!Number.isFinite(u) || u < 0))) {
    return { isValid: false, rangePosition: null, minAchievement: null, maxAchievement: null, midTarget: null, isEqualTarget: false, status: null, minZero: false, maxZero: false }
  }
  if (l !== null && u !== null && l > u) {
    return { isValid: false, rangePosition: null, minAchievement: null, maxAchievement: null, midTarget: null, isEqualTarget: false, status: null, minZero: false, maxZero: false }
  }
  const minZero = l === 0
  const maxZero = u === 0
  const minAch = l && l > 0 ? (100 * a) / l : null
  const maxAch = u && u > 0 ? (100 * a) / u : null
  if (l !== null && u !== null && l === u) {
    const status: IsaPositionStatus = a < l ? 'below' : a > l ? 'above' : 'within'
    return { isValid: true, rangePosition: null, minAchievement: minAch, maxAchievement: maxAch, midTarget: null, isEqualTarget: true, status, minZero, maxZero }
  }
  if (l !== null && u !== null) {
    const rangePosition = (100 * (a - l)) / (u - l)
    const midTarget = Math.round((l + u) / 2)
    const status: IsaPositionStatus = rangePosition < 0 ? 'below' : rangePosition > 100 ? 'above' : 'within'
    return { isValid: true, rangePosition, minAchievement: minAch, maxAchievement: maxAch, midTarget, isEqualTarget: false, status, minZero, maxZero }
  }
  const status: IsaPositionStatus | null = l !== null ? (a < l ? 'below' : 'within') : u !== null ? (a <= u ? 'within' : 'above') : null
  return { isValid: true, rangePosition: null, minAchievement: minAch, maxAchievement: maxAch, midTarget: null, isEqualTarget: false, status, minZero, maxZero }
}
