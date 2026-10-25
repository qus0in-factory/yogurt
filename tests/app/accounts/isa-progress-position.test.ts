import { describe, expect, it } from 'vitest'
import { calculateIsaPosition, formatPercent } from '../../../src/app/accounts/isa-progress-position'

describe('isa-progress-position', () => {
  it('A=1500만, L=1000만, U=2000만일 때 정상 계산', () => {
    const res = calculateIsaPosition({ currentAssets: 15_000_000, minTarget: 10_000_000, maxTarget: 20_000_000 })
    expect(res.isValid).toBe(true)
    expect(res.rangePosition).toBe(50)
    expect(res.minAchievement).toBe(150)
    expect(res.maxAchievement).toBe(75)
    expect(res.midTarget).toBe(15_000_000)
    expect(res.status).toBe('within')
  })

  it('지적 B: 최소=최대, 최소=0, A<L 미달, A>U 초과 경계값과 0 나눗셈 방지', () => {
    const zeroTarget = calculateIsaPosition({ currentAssets: 5_000_000, minTarget: 0, maxTarget: 10_000_000 })
    expect(zeroTarget.isValid).toBe(true)
    expect(zeroTarget.minZero).toBe(true)
    expect(zeroTarget.minAchievement).toBeNull() // 0 나눗셈 방지
    expect(zeroTarget.rangePosition).toBe(50) // 100 * (5M - 0) / 10M

    const equalZero = calculateIsaPosition({ currentAssets: 5_000_000, minTarget: 0, maxTarget: 0 })
    expect(equalZero.isValid).toBe(true)
    expect(equalZero.minZero).toBe(true)
    expect(equalZero.maxZero).toBe(true)
    expect(equalZero.rangePosition).toBeNull()

    const below = calculateIsaPosition({ currentAssets: 2_000_000, minTarget: 10_000_000, maxTarget: 20_000_000 })
    expect(below.status).toBe('below')
    expect(Number.isFinite(below.rangePosition)).toBe(true)
    expect(below.rangePosition).toBeLessThan(0)

    const above = calculateIsaPosition({ currentAssets: 25_000_000, minTarget: 10_000_000, maxTarget: 20_000_000 })
    expect(above.status).toBe('above')
    expect(Number.isFinite(above.rangePosition)).toBe(true)
    expect(above.rangePosition).toBeGreaterThan(100)
  })

  it('확정사항 4 사잇값 50% 및 경계값 (L=U일 때, 한쪽 비었을 때)', () => {
    const equal = calculateIsaPosition({ currentAssets: 10_000_000, minTarget: 10_000_000, maxTarget: 10_000_000 })
    expect(equal.midTarget).toBeNull()
    expect(equal.rangePosition).toBeNull()
    expect(equal.isEqualTarget).toBe(true)

    const onlyMin = calculateIsaPosition({ currentAssets: 10_000_000, minTarget: 10_000_000, maxTarget: null })
    expect(onlyMin.midTarget).toBeNull()
    expect(onlyMin.rangePosition).toBeNull()

    const onlyMax = calculateIsaPosition({ currentAssets: 10_000_000, minTarget: null, maxTarget: 20_000_000 })
    expect(onlyMax.midTarget).toBeNull()
    expect(onlyMax.rangePosition).toBeNull()
  })

  it('A=0, 음수 평가액, 비유한 값, L > U 처리', () => {
    const zero = calculateIsaPosition({ currentAssets: 0, minTarget: 10_000_000, maxTarget: 20_000_000 })
    expect(zero.rangePosition).toBe(-100)
    expect(zero.minAchievement).toBe(0)

    const invalid = calculateIsaPosition({ currentAssets: Number.NaN, minTarget: 10_000_000, maxTarget: 20_000_000 })
    expect(invalid.isValid).toBe(false)
  })

  it('formatPercent: 소수 첫째자리 반올림 및 NaN/비유한 방지', () => {
    expect(formatPercent(50)).toBe('50.0%')
    expect(formatPercent(-0.0001)).toBe('0.0%')
    expect(formatPercent(Number.NaN)).toBeNull()
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBeNull()
  })
})
