import { describe, expect, it } from 'vitest'
import { productPlanRequestSchema, productPlanSchema } from '../../../src/domain/accounts/product-plan'

describe('productPlanSchema and productPlanRequestSchema', () => {
  it('실존 시작일과 null/0/정수 목표금액을 허용한다', () => {
    const plan = { startDate: '2024-02-29', minTargetAmountWon: 0, maxTargetAmountWon: 12_500_000 }
    expect(productPlanSchema.parse(plan)).toEqual(plan)
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-03-15', minTargetAmountWon: 10_000_000, maxTargetAmountWon: null,
    }).success).toBe(true)
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-03-15', minTargetAmountWon: 10_000_000, maxTargetAmountWon: 10_000_000,
    }).success).toBe(true)
  })

  it('잘못된 날짜 형식이나 존재하지 않는 날짜를 거부한다', () => {
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-02-30', minTargetAmountWon: null, maxTargetAmountWon: null,
    }).success).toBe(false)
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-2-09', minTargetAmountWon: null, maxTargetAmountWon: null,
    }).success).toBe(false)
  })

  it('음수·소수·비안전 정수 금액과 최소>최대 범위를 거부한다', () => {
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-03-15', minTargetAmountWon: -1, maxTargetAmountWon: null,
    }).success).toBe(false)
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-03-15', minTargetAmountWon: null, maxTargetAmountWon: 10.5,
    }).success).toBe(false)
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-03-15', minTargetAmountWon: Number.MAX_SAFE_INTEGER + 1, maxTargetAmountWon: null,
    }).success).toBe(false)
    expect(productPlanRequestSchema.safeParse({
      startDate: '2024-03-15', minTargetAmountWon: 20_000_000, maxTargetAmountWon: 10_000_000,
    }).success).toBe(false)
  })

  it('세 필드가 모두 null일 때만 계획 삭제로 허용하고 시작일만 null인 조합은 거부한다', () => {
    const emptyPlan = { startDate: null, minTargetAmountWon: null, maxTargetAmountWon: null }
    expect(productPlanRequestSchema.parse(emptyPlan)).toEqual(emptyPlan)
    expect(productPlanRequestSchema.safeParse({
      startDate: null, minTargetAmountWon: 10_000_000, maxTargetAmountWon: null,
    }).success).toBe(false)
    expect(productPlanRequestSchema.safeParse({
      startDate: null, minTargetAmountWon: null, maxTargetAmountWon: 10_000_000,
    }).success).toBe(false)
  })
})
