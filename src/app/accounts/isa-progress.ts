import { isaExpiry } from './isa-term'
import { generateProgressWindowMonths } from './isa-progress-months'
import { calculateProgressPath, type PathPoint } from './isa-progress-path'
import { calculateIsaPosition, type IsaPositionResult } from './isa-progress-position'

export type IsaProgressState =
  | 'no_plan'
  | 'no_targets'
  | 'expired'
  | 'assets_missing'
  | 'invalid'
  | 'ready'

export interface IsaPlanInput {
  startDate?: string
  minTarget?: number | null
  maxTarget?: number | null
  minTargetAmountWon?: number | null
  maxTargetAmountWon?: number | null
}

export interface IsaProgressData {
  state: IsaProgressState
  expiry: string | null
  months: string[]
  pathPoints: PathPoint[]
  position: IsaPositionResult | null
  hasMid: boolean
  currentMonth?: string
  currentIndex?: number
  currentPoint?: PathPoint | null
  effectiveAssets?: number
  dotIndex?: number
  dotMonth?: string
}

export function computeIsaProgress(
  today: string,
  plan: IsaPlanInput | null | undefined,
  totalAssets: number | null | undefined,
  lastClosedAssets?: number | null,
  halfSpan?: number,
): IsaProgressData {
  if (!plan?.startDate) {
    return { state: 'no_plan', expiry: null, months: [], pathPoints: [], position: null, hasMid: false }
  }
  const expiry = isaExpiry(plan.startDate)
  if (!expiry) return { state: 'invalid', expiry: null, months: [], pathPoints: [], position: null, hasMid: false }
  if (today > expiry) return { state: 'expired', expiry, months: [], pathPoints: [], position: null, hasMid: false }
  const l = plan.minTargetAmountWon ?? plan.minTarget ?? null
  const u = plan.maxTargetAmountWon ?? plan.maxTarget ?? null
  if (l === null && u === null) return { state: 'no_targets', expiry, months: [], pathPoints: [], position: null, hasMid: false }
  if (totalAssets === null || totalAssets === undefined || !Number.isFinite(totalAssets)) {
    return { state: 'assets_missing', expiry, months: [], pathPoints: [], position: null, hasMid: false }
  }
  if ((l !== null && l < 0) || (u !== null && u < 0) || (l !== null && u !== null && l > u)) {
    return { state: 'invalid', expiry, months: [], pathPoints: [], position: null, hasMid: false }
  }
  const months = generateProgressWindowMonths(today, plan.startDate, expiry, halfSpan)
  const path = calculateProgressPath({ startDate: plan.startDate, minTarget: l, maxTarget: u, months })
  const curMonth = today.slice(0, 7)
  const expiryMonth = expiry.slice(0, 7)
  const isExp = curMonth === expiryMonth
  const effectiveAssets = isExp && lastClosedAssets !== null && lastClosedAssets !== undefined ? lastClosedAssets : totalAssets
  const foundIdx = months.indexOf(curMonth)
  const currentIndex = foundIdx >= 0 ? foundIdx : Math.floor(months.length / 2)
  const dotIndex = isExp ? Math.max(0, currentIndex - 1) : currentIndex
  const dotMonth = months[dotIndex] ?? curMonth
  const currentPoint = path.points[dotIndex] ?? null
  const curMin = currentPoint ? currentPoint.min : l
  const curMax = currentPoint ? currentPoint.max : u
  const position = calculateIsaPosition({ currentAssets: effectiveAssets, minTarget: curMin, maxTarget: curMax })
  if (!position.isValid) return { state: 'invalid', expiry, months: [], pathPoints: [], position: null, hasMid: false }
  return {
    state: 'ready', expiry, months, pathPoints: path.points, position, hasMid: path.hasMid,
    currentMonth: curMonth, currentIndex, currentPoint, effectiveAssets, dotIndex, dotMonth,
  }
}
