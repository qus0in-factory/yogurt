import { describe, expect, it } from 'vitest'
import {
  calculateCurrentMonthTargets,
  formatDiffManwon,
} from '../../../src/app/accounts/isa-progress-diff'

describe('isa-progress-diff', () => {
  const [U, N, S, B] = ['만', '목표 없음', '시작일 필요', '시작 전']

  it('I. 단위 텍스트를 인수로 받아 포맷하고 하드코딩 제거', () => {
    expect(formatDiffManwon(1_200_000, U, N)).toBe('+120만')
    expect(formatDiffManwon(-10_800_000, U, N)).toBe('-1,080만')
    expect(formatDiffManwon(0, U, N)).toBe('0만')
    expect(formatDiffManwon(null, U, N)).toBe(N)
    expect(formatDiffManwon(Number.NaN, U, N)).toBe(N)
  })

  it('24개월 사례: 2,400 / 3,600 / 4,800 만 원 및 차이 계산 (+120만, -1,080만, -2,280만)', () => {
    const res = calculateCurrentMonthTargets('2024-11-01', '2026-10-25', 36_000_000, 72_000_000, 25_200_000, U, N, S, B)
    expect(res.k).toBe(24)
    expect(res.minTargetManwon).toBe(2400)
    expect(res.midTargetManwon).toBe(3600)
    expect(res.maxTargetManwon).toBe(4800)
    expect(res.minDiffText).toBe('+120만')
    expect(res.midDiffText).toBe('-1,080만')
    expect(res.maxDiffText).toBe('-2,280만')
  })

  it('E·F. 시작일 없음 → 시작일 필요 문구 반환', () => {
    const res = calculateCurrentMonthTargets(undefined, '2026-10-25', 36_000_000, 72_000_000, 25_200_000, U, N, S, B)
    expect(res.minDiffText).toBe(S)
    expect(res.minTargetManwon).toBeNull()
  })

  it('시작일 미래 + 최대 null + 평가액 2520만 → 최대 줄 목표 없음, +2520만 없음', () => {
    const res = calculateCurrentMonthTargets('2026-11-01', '2026-10-25', 36_000_000, null, 25_200_000, U, N, S, B)
    expect(res.maxTargetManwon).toBeNull()
    expect(res.maxDiffText).toBe(N)
    expect(res.maxDiffText).not.toContain('+2,520')
    expect(res.midDiffText).toBe(N)
    expect(res.minDiffText).toBe(B)
  })

  it('시작일 미래 + 목표 모두 있음 → 차이 줄은 시작 전, 숫자 차이 없음', () => {
    const res = calculateCurrentMonthTargets('2026-11-01', '2026-10-25', 36_000_000, 72_000_000, 25_200_000, U, N, S, B)
    expect(res.minDiffText).toBe(B)
    expect(res.midDiffText).toBe(B)
    expect(res.maxDiffText).toBe(B)
  })

  it('시작일 과거 + 최대 null → 최대 줄은 목표 없음', () => {
    const res = calculateCurrentMonthTargets('2024-11-01', '2026-10-25', 36_000_000, null, 25_200_000, U, N, S, B)
    expect(res.maxTargetManwon).toBeNull()
    expect(res.maxDiffText).toBe(N)
    expect(res.midDiffText).toBe(N)
    expect(res.minDiffText).toBe('+120만')
  })
})
