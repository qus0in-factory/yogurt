import { describe, expect, it } from 'vitest'
import { computeIsaProgress } from '../../../src/app/accounts/isa-progress'

describe('isa-progress computeIsaProgress with window & closing rule', () => {
  const plan = {
    startDate: '2024-01-15',
    minTargetAmountWon: 36_000_000,
    maxTargetAmountWon: 72_000_000,
  }

  it('데스크톱 기본 구간 7칸, 가운데 칸 현재 월', () => {
    const res = computeIsaProgress('2025-06-15', plan, 20_000_000)
    expect(res.state).toBe('ready')
    expect(res.months).toHaveLength(7)
    expect(res.months[3]).toBe('2025-06')
    expect(res.currentIndex).toBe(3)
  })

  it('모바일(halfSpan=1) 구간 3칸, 가운데 칸 현재 월', () => {
    const res = computeIsaProgress('2025-06-15', plan, 20_000_000, undefined, 1)
    expect(res.state).toBe('ready')
    expect(res.months).toHaveLength(3)
    expect(res.months[1]).toBe('2025-06')
    expect(res.currentIndex).toBe(1)
  })

  it('현재 월이 만기 월(2027-01)일 때 실제 점이 직전 월 마감 값이다', () => {
    const res = computeIsaProgress('2027-01-10', plan, 50_000_000, 45_000_000)
    expect(res.state).toBe('ready')
    expect(res.effectiveAssets).toBe(45_000_000)
    expect(res.dotMonth).toBe('2026-12')
    expect(res.months[res.dotIndex!]).toBe('2026-12')
  })

  it('현재 월이 만기 월이 아닐 때는 현재 월 칸에 현재 평가액 점을 찍는다', () => {
    const res = computeIsaProgress('2026-10-25', plan, 30_000_000, 28_000_000)
    expect(res.effectiveAssets).toBe(30_000_000)
    expect(res.dotMonth).toBe('2026-10')
  })
})
