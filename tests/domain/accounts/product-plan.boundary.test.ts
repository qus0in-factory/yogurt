import { expect, it } from 'vitest'
import { productPlanSchema, productPlanRequestSchema } from '../../../src/domain/accounts/product-plan'

const base = { startDate: '2026-10-25', minTargetAmountWon: null, maxTargetAmountWon: null }

it.each([productPlanSchema, productPlanRequestSchema])('두 스키마의 금액 경계', (schema) => {
  for (const amount of [0, 1, Number.MAX_SAFE_INTEGER]) {
    const equal = { ...base, minTargetAmountWon: amount, maxTargetAmountWon: amount }
    expect(schema.safeParse(equal).success).toBe(true)
    expect(schema.safeParse({ ...base, maxTargetAmountWon: amount }).success).toBe(true)
  }
  for (const field of ['minTargetAmountWon', 'maxTargetAmountWon']) {
    for (const amount of [-1, 0.1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '1']) {
      expect(schema.safeParse({ ...base, [field]: amount }).success).toBe(false)
    }
  }
  expect(schema.safeParse({ ...base, minTargetAmountWon: 1, maxTargetAmountWon: 0 }).success).toBe(false)
})

it.each([undefined, null, {}, { startDate: base.startDate }])('불완전한 입력 %j는 거부한다', (input) => {
  expect(productPlanSchema.safeParse(input).success).toBe(false)
  expect(productPlanRequestSchema.safeParse(input).success).toBe(false)
})

it.each(['2025-02-29', '2026-04-31', '2026-00-01', '2026-13-01', ''])('실존하지 않는 날짜 %s', (startDate) => {
  expect(productPlanSchema.safeParse({ ...base, startDate }).success).toBe(false)
  expect(productPlanRequestSchema.safeParse({ ...base, startDate }).success).toBe(false)
})

it('금액 0도 시작일 없는 삭제 요청에 포함할 수 없다', () => {
  for (const field of ['minTargetAmountWon', 'maxTargetAmountWon']) {
    expect(productPlanRequestSchema.safeParse({ ...base, startDate: null, [field]: 0 }).success).toBe(false)
  }
  expect(productPlanSchema.safeParse({ ...base, startDate: null }).success).toBe(false)
})
