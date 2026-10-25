import { describe, expect, it } from 'vitest'
import { calculateProgressPath, calculateAxisRange } from '../../../src/app/accounts/isa-progress-path'

describe('isa-progress-path with window', () => {
  it('하단·상단 2024-01 시작/2025-06 현재/평가 2520만 -> 하단 1000만, 상단 5000만, 첫점 1500만 y 168.75', () => {
    const points = [
      { month: '2025-03', min: 15_000_000, mid: 22_500_000, max: 30_000_000 },
      { month: '2025-06', min: 18_000_000, mid: 27_000_000, max: 36_000_000 },
      { month: '2025-09', min: 21_000_000, mid: 31_500_000, max: 42_000_000 },
    ]
    const axis = calculateAxisRange(25_200_000, points)
    expect(axis.minManwon).toBe(1000)
    expect(axis.maxManwon).toBe(5000)
    expect(axis.ticks).toEqual([1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000])
    const ptY = 20 + 170 - ((1500 - axis.minManwon) / (axis.maxManwon - axis.minManwon)) * 170
    expect(ptY).toBe(168.75)
  })

  it('sol 재현: 평가 -100만 및 50만, 최초 1500만 -> 하단 500만(0 이하 불가)', () => {
    const points = [{ month: '2025-03', min: 15_000_000, mid: 20_000_000, max: 30_000_000 }]
    const axisNeg = calculateAxisRange(-1_000_000, points)
    expect(axisNeg.minManwon).toBe(500)
    expect(axisNeg.ticks[0]).toBe(500)

    const axisLow = calculateAxisRange(500_000, points)
    expect(axisLow.minManwon).toBe(500)
    expect(axisLow.ticks[0]).toBe(500)
  })

  it('배열 입력 분기에서도 0 이하 시 하단 500 적용', () => {
    const axisArr = calculateAxisRange([500_000, 1_000_000])
    expect(axisArr.minManwon).toBe(500)
    expect(axisArr.ticks[0]).toBe(500)
  })

  it('음수 방지: 모든 경로 값 >= 0, 밴드 역전 없음', () => {
    const res = calculateProgressPath({
      startDate: '2026-06-01',
      minTarget: 36_000_000,
      maxTarget: 72_000_000,
      months: ['2026-04', '2026-05', '2026-06', '2026-07'],
    })
    for (const pt of res.points) {
      if (pt.min !== null) expect(pt.min).toBeGreaterThanOrEqual(0)
      if (pt.mid !== null) expect(pt.mid).toBeGreaterThanOrEqual(0)
      if (pt.max !== null) expect(pt.max).toBeGreaterThanOrEqual(0)
      if (pt.min !== null && pt.max !== null) expect(pt.min).toBeLessThanOrEqual(pt.max)
    }
  })

  it('k 정의: 시작 월 k = 1 (1M), 24개월 경과 시점 2400만~4800만', () => {
    const res = calculateProgressPath({
      startDate: '2024-11-01',
      minTarget: 36_000_000,
      maxTarget: 72_000_000,
      months: ['2026-10'],
    })
    expect(res.points[0]?.min).toBe(24_000_000)
    expect(res.points[0]?.mid).toBe(36_000_000)
    expect(res.points[0]?.max).toBe(48_000_000)
  })
})
