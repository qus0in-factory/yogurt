import { isaK } from './isa-term'

export interface PathPoint {
  month: string
  min: number | null
  mid: number | null
  max: number | null
}

export interface ProgressPathInput {
  startDate?: string
  currentAssets?: number
  minTarget: number | null
  maxTarget: number | null
  months: string[]
}

export interface ProgressPathResult {
  points: PathPoint[]
  hasMid: boolean
}

export interface AxisRange {
  minManwon: number
  maxManwon: number
  ticks: number[]
}

export function calculateProgressPath(input: ProgressPathInput): ProgressPathResult {
  const { startDate, minTarget: l, maxTarget: u, months } = input
  const hasMid = l !== null && u !== null && l < u
  const midTarget = hasMid ? Math.round((l + u) / 2) : null

  const points: PathPoint[] = months.map((month, index) => {
    const k = startDate ? isaK(startDate, month) : Math.min(36, Math.max(0, index + 1))
    if (k <= 0) {
      return { month, min: l !== null ? 0 : null, mid: midTarget !== null ? 0 : null, max: u !== null ? 0 : null }
    }
    const minVal = l !== null ? Math.max(0, Math.round((l * k) / 36)) : null
    const maxVal = u !== null ? Math.max(0, Math.round((u * k) / 36)) : null
    const midVal = midTarget !== null ? Math.max(0, Math.round((midTarget * k) / 36)) : null
    const [min, max] = minVal !== null && maxVal !== null && minVal > maxVal ? [maxVal, minVal] : [minVal, maxVal]
    return { month, min, mid: midVal, max }
  })

  return { points, hasMid }
}

export function calculateAxisRange(currentOrAmounts: number | number[], points?: PathPoint[]): AxisRange {
  if (Array.isArray(currentOrAmounts)) {
    const manwons = currentOrAmounts.map((v) => Math.max(0, v / 10_000))
    const raw = Math.min(...manwons) - 500
    const floored = Math.floor(raw / 500) * 500
    const minManwon = floored <= 0 ? 500 : floored
    const maxManwon = Math.max(minManwon + 500, Math.ceil((Math.max(...manwons) + 500) / 500) * 500)
    const ticks: number[] = []
    for (let t = minManwon; t <= maxManwon; t += 500) ticks.push(t)
    return { minManwon, maxManwon, ticks }
  }
  const curMan = currentOrAmounts / 10_000
  const pts = points ?? []
  const eMin = pts.find((p) => p.min !== null)?.min ?? null
  const lMax = [...pts].reverse().find((p) => p.max !== null)?.max ?? null
  const eMinMan = eMin !== null ? eMin / 10_000 : curMan
  const lMaxMan = lMax !== null ? lMax / 10_000 : curMan
  const rawMin = Math.min(curMan - 500, eMinMan - 500)
  const flooredMin = Math.floor(rawMin / 500) * 500
  const minManwon = flooredMin <= 0 ? 500 : flooredMin
  const rawMax = Math.max(curMan + 500, lMaxMan + 500)
  const maxManwon = Math.max(minManwon + 500, Math.ceil(rawMax / 500) * 500)
  const ticks: number[] = []
  for (let t = minManwon; t <= maxManwon; t += 500) ticks.push(t)
  return { minManwon, maxManwon, ticks }
}
