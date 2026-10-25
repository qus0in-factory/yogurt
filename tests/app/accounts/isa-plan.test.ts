import { describe, expect, it } from 'vitest'
import { fromProductPlan, toProductPlanRequest, validateIsaPlanDraft } from '../../../src/app/accounts/isa-plan'

const draft = (min: number | null = null, max: number | null = null) => ({
  startDate: '2024-03-15', minTargetAmountManwon: min, maxTargetAmountManwon: max,
})

describe('validateIsaPlanDraft', () => {
  it('시작일이 없거나 실존 날짜가 아니면 거부한다', () => {
    expect(validateIsaPlanDraft({ ...draft(), startDate: '' })).toBe('required')
    expect(validateIsaPlanDraft({ ...draft(), startDate: '2024-02-30' })).toBe('invalid')
  })

  it('금액은 비우거나 0 이상 정수만 허용한다', () => {
    expect(validateIsaPlanDraft(draft())).toBeNull()
    expect(validateIsaPlanDraft(draft(0, 0))).toBeNull()
    expect(validateIsaPlanDraft(draft(-1))).toBe('minTargetInvalid')
    expect(validateIsaPlanDraft(draft(1.5))).toBe('minTargetInvalid')
    expect(validateIsaPlanDraft(draft(null, -2))).toBe('maxTargetInvalid')
  })

  it('최소가 최대를 넘으면 거부하고, 원 환산이 안전 정수를 넘으면 거부한다', () => {
    expect(validateIsaPlanDraft(draft(2, 1))).toBe('targetRangeInvalid')
    expect(validateIsaPlanDraft(draft(Number.MAX_SAFE_INTEGER))).toBe('minTargetInvalid')
  })
})

describe('만원↔원 변환', () => {
  it('만원 초안을 원 단위 전체 요청으로 바꾼다', () => {
    expect(toProductPlanRequest(draft(1250))).toEqual({
      startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null,
    })
  })

  it('응답 계획을 만원 초안으로 되돌린다', () => {
    expect(fromProductPlan({
      startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: 0,
    })).toEqual({ startDate: '2024-03-15', minTargetAmountManwon: 1250, maxTargetAmountManwon: 0 })
    expect(fromProductPlan(undefined)).toEqual({
      startDate: '', minTargetAmountManwon: null, maxTargetAmountManwon: null,
    })
  })
})
