import { describe, expect, it } from 'vitest'
import type { Portfolio } from '../../../../src/domain/portfolio/portfolio'
import { buildPortfolioPieModel, PIE_MAX_INDIVIDUAL_SLICES } from '../../../../src/ui/operations/portfolio-list/portfolio-list-model'

function makePortfolio(weights: number[]): Portfolio {
  return {
    id: 'p-test',
    name: '테스트',
    createdAt: '2026-10-26',
    updatedAt: '2026-10-26',
    items: weights.map((w, idx) => ({
      kind: 'security',
      stockCode: `A${idx + 1}`,
      stockName: `종목${idx + 1}`,
      targetWeightBps: w,
    })),
  }
}

describe('buildPortfolioPieModel 개별 슬라이스 최대 7개 규칙', () => {
  it('PIE_MAX_INDIVIDUAL_SLICES 상수는 7이다', () => {
    expect(PIE_MAX_INDIVIDUAL_SLICES).toBe(7)
  })

  it('6개 항목은 기타 슬라이스가 없다', () => {
    const portfolio = makePortfolio([2000, 2000, 2000, 2000, 1000, 1000])
    const model = buildPortfolioPieModel(portfolio)
    expect(model.valid).toBe(true)
    expect(model.slices).toHaveLength(6)
    expect(model.slices.some((s) => s.key === 'other')).toBe(false)
  })

  it('7개 항목은 기타 슬라이스가 없다', () => {
    const portfolio = makePortfolio([2000, 2000, 2000, 1000, 1000, 1000, 1000])
    const model = buildPortfolioPieModel(portfolio)
    expect(model.valid).toBe(true)
    expect(model.slices).toHaveLength(7)
    expect(model.slices.some((s) => s.key === 'other')).toBe(false)
  })

  it('8개 항목은 상위 7개 + 기타(1개 항목 비중)로 분할된다', () => {
    const portfolio = makePortfolio([2000, 2000, 1500, 1500, 1000, 1000, 600, 400])
    const model = buildPortfolioPieModel(portfolio)
    expect(model.valid).toBe(true)
    expect(model.slices).toHaveLength(8)
    expect(model.slices[7].key).toBe('other')
    expect(model.slices[7].weightBps).toBe(400)
    expect(model.slices[7].label).toBe('기타')
  })

  it('9개 이상 항목은 기타 비중이 8번째 이후 나머지 합계와 같다', () => {
    const portfolio = makePortfolio([2000, 1500, 1500, 1200, 1200, 1000, 600, 600, 400])
    const model = buildPortfolioPieModel(portfolio)
    expect(model.valid).toBe(true)
    expect(model.slices).toHaveLength(8)
    expect(model.slices[7].key).toBe('other')
    expect(model.slices[7].weightBps).toBe(1000)
  })
})
