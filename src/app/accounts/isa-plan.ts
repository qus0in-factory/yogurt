import type { ProductPlan, ProductPlanRequest } from '../../domain/accounts/product-plan'

export type IsaPlanDraft = {
  startDate: string
  minTargetAmountManwon: number | null
  maxTargetAmountManwon: number | null
}
export type IsaPlanValidationError = 'required' | 'invalid' | 'minTargetInvalid' | 'maxTargetInvalid' | 'targetRangeInvalid'

const WON_PER_MANWON = 10_000

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validAmount(value: number | null): boolean {
  return value === null || (Number.isSafeInteger(value) && value >= 0 && Number.isSafeInteger(value * WON_PER_MANWON))
}

export function validateIsaPlanDraft(draft: IsaPlanDraft): IsaPlanValidationError | null {
  if (!draft.startDate) return 'required'
  if (!isIsoDate(draft.startDate)) return 'invalid'
  if (!validAmount(draft.minTargetAmountManwon)) return 'minTargetInvalid'
  if (!validAmount(draft.maxTargetAmountManwon)) return 'maxTargetInvalid'
  const min = draft.minTargetAmountManwon
  const max = draft.maxTargetAmountManwon
  if (min !== null && max !== null && min > max) return 'targetRangeInvalid'
  return null
}

export function toProductPlanRequest(draft: IsaPlanDraft): ProductPlanRequest {
  return {
    startDate: draft.startDate || null,
    minTargetAmountWon: draft.minTargetAmountManwon === null ? null : draft.minTargetAmountManwon * WON_PER_MANWON,
    maxTargetAmountWon: draft.maxTargetAmountManwon === null ? null : draft.maxTargetAmountManwon * WON_PER_MANWON,
  }
}

export function fromProductPlan(plan?: Partial<ProductPlan>): IsaPlanDraft {
  return {
    startDate: plan?.startDate ?? '',
    minTargetAmountManwon: plan?.minTargetAmountWon == null ? null : plan.minTargetAmountWon / WON_PER_MANWON,
    maxTargetAmountManwon: plan?.maxTargetAmountWon == null ? null : plan.maxTargetAmountWon / WON_PER_MANWON,
  }
}

export function parseManwonInput(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export function isManwonInputValid(value: string): boolean {
  return value.trim() === '' || /^\d+$/.test(value.trim())
}
