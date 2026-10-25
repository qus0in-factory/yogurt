import { describe, expect, it } from 'vitest'
import {
  generateProgressMonths,
  generateProgressWindowMonths,
  PROGRESS_WINDOW_HALF_SPAN_DESKTOP,
  PROGRESS_WINDOW_HALF_SPAN_MOBILE,
} from '../../../src/app/accounts/isa-progress-months'

describe('isa-progress-months window desktop(3) & mobile(1)', () => {
  it('상수 확인: 데스크톱 앞뒤 3개월(7칸), 모바일 앞뒤 1개월(3칸)', () => {
    expect(PROGRESS_WINDOW_HALF_SPAN_DESKTOP).toBe(3)
    expect(PROGRESS_WINDOW_HALF_SPAN_MOBILE).toBe(1)
  })

  it('데스크톱 폭(halfSpan=3): 구간 7칸, 가운데 칸 현재 월', () => {
    const m = generateProgressWindowMonths('2026-10-25', '2024-01-01', '2029-01-01', PROGRESS_WINDOW_HALF_SPAN_DESKTOP)
    expect(m).toHaveLength(7)
    expect(m[0]).toBe('2026-07')
    expect(m[3]).toBe('2026-10')
    expect(m[6]).toBe('2027-01')
  })

  it('모바일 폭(halfSpan=1): 구간 3칸, 가운데 칸 현재 월, 앞뒤 1개월', () => {
    const m = generateProgressWindowMonths('2026-10-25', '2024-01-01', '2029-01-01', PROGRESS_WINDOW_HALF_SPAN_MOBILE)
    expect(m).toHaveLength(3)
    expect(m[0]).toBe('2026-09')
    expect(m[1]).toBe('2026-10')
    expect(m[2]).toBe('2026-11')
  })

  it('시작 월 이전·만기 월 이후 칸이 그려지지 않는지 확인', () => {
    const m = generateProgressWindowMonths('2026-10-25', '2026-09-01', '2026-12-15')
    expect(m[0]).toBe('2026-09')
    expect(m[m.length - 1]).toBe('2026-12')
  })

  it('기존 generateProgressMonths 유지', () => {
    const m = generateProgressMonths('2026-10-25', '2027-03-15')
    expect(m).toEqual(['2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'])
  })
})
