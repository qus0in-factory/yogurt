export const COLLATERAL_MIN_PERCENT = 140
export const NEW_LOAN_MAX_PERCENT = 60
export const MAX_LOAN_KRW = 50_000_000
export const LOAN_MIN_AVAILABLE_KRW = 10_000
export const requiredCollateral = MAX_LOAN_KRW / (NEW_LOAN_MAX_PERCENT / 100)

export function withdrawableExcess(fundEvaluation: number) {
  return Math.max(0, Math.floor(fundEvaluation - requiredCollateral))
}

function availableLoanKrw({ loanAmount, collateralAmount }: { loanAmount: number; collateralAmount: number }) {
  const limit = Math.min(MAX_LOAN_KRW, Math.floor(collateralAmount * NEW_LOAN_MAX_PERCENT / 100))
  return Math.max(0, limit - loanAmount)
}

export function loanRatios({ loanAmount, collateralAmount }: { loanAmount: number; collateralAmount: number }) {
  const available = availableLoanKrw({ loanAmount, collateralAmount })
  if (loanAmount === 0) {
    return { collateralRatio: null, loanRatio: 0, collateralOk: true, availableLoanKrw: available, newLoanAvailable: available >= LOAN_MIN_AVAILABLE_KRW }
  }
  if (collateralAmount === 0) {
    return { collateralRatio: 0, loanRatio: null, collateralOk: false, availableLoanKrw: available, newLoanAvailable: false }
  }
  const collateralRaw = collateralAmount / loanAmount * 100
  const loanRaw = loanAmount / collateralAmount * 100
  const round = (value: number) => Math.round(value * 100) / 100
  return {
    collateralRatio: round(collateralRaw),
    loanRatio: round(loanRaw),
    collateralOk: collateralRaw > COLLATERAL_MIN_PERCENT,
    availableLoanKrw: available,
    newLoanAvailable: loanRaw < NEW_LOAN_MAX_PERCENT && available >= LOAN_MIN_AVAILABLE_KRW,
  }
}
