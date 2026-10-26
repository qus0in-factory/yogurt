import { describe, expect, it } from 'vitest'
import { clampTooltipPosition } from '../../../src/ui/lib/tooltip-position'

describe('clampTooltipPosition', () => {
  it('화면 왼쪽 가장자리 근처에서 툴팁이 뷰포트 안(padding 8px)에 머문다', () => {
    // tooltipWidth 200, half 100. padding 8. centerX 20 -> clamped to 108
    const pos = clampTooltipPosition(20, 200, 1000, 8)
    expect(pos).toBe(108)
  })

  it('화면 오른쪽 가장자리 근처에서 툴팁이 뷰포트 안(padding 8px)에 머문다', () => {
    // viewport 1000, tooltipWidth 200, half 100, padding 8 -> max is 892. centerX 980 -> clamped to 892
    const pos = clampTooltipPosition(980, 200, 1000, 8)
    expect(pos).toBe(892)
  })

  it('중앙에서는 원래 centerX를 유지한다', () => {
    const pos = clampTooltipPosition(500, 200, 1000, 8)
    expect(pos).toBe(500)
  })
})
