import { describe, expect, it } from 'vitest'
import { COLLATERAL_MIN_PERCENT, MAX_LOAN_KRW, NEW_LOAN_MAX_PERCENT, loanRatios, requiredCollateral, withdrawableExcess } from '../../../src/app/kis/loan-ratios'

describe('loanRatios', () => {
  it('담보비율 140.00%이면 충족하지 않는다', () => {
    const result = loanRatios({ loanAmount: 1000, collateralAmount: 1400 })
    expect(result.collateralRatio).toBe(140)
    expect(result.collateralOk).toBe(false)
    expect(COLLATERAL_MIN_PERCENT).toBe(140)
  })

  it('담보비율 140.01%이면 충족한다', () => {
    const result = loanRatios({ loanAmount: 10000, collateralAmount: 14001 })
    expect(result.collateralRatio).toBe(140.01)
    expect(result.collateralOk).toBe(true)
  })

  it('융자비율 59.99%이면 신규 대출이 가능하다', () => {
    const result = loanRatios({ loanAmount: 599.9, collateralAmount: 1000 })
    expect(result.loanRatio).toBe(59.99)
    expect(result.newLoanAvailable).toBe(true)
    expect(NEW_LOAN_MAX_PERCENT).toBe(60)
  })

  it('융자비율 60.00%이면 신규 대출이 불가능하다', () => {
    const result = loanRatios({ loanAmount: 600, collateralAmount: 1000 })
    expect(result.loanRatio).toBe(60)
    expect(result.newLoanAvailable).toBe(false)
  })

  it('표시값이 반올림되어도 판정은 반올림 전 값으로 한다', () => {
    const result = loanRatios({ loanAmount: 599.99, collateralAmount: 1000 })
    expect(result.loanRatio).toBe(60)
    expect(result.newLoanAvailable).toBe(true)
  })

  it('대출이 0이면 담보비율은 null이고 대출 가능하다', () => {
    expect(loanRatios({ loanAmount: 0, collateralAmount: 0 })).toEqual({
      collateralRatio: null, loanRatio: 0, collateralOk: true, newLoanAvailable: true,
    })
  })

  it('담보가 0이고 대출이 있으면 둘 다 불가능하다', () => {
    expect(loanRatios({ loanAmount: 1000, collateralAmount: 0 })).toEqual({
      collateralRatio: 0, loanRatio: null, collateralOk: false, newLoanAvailable: false,
    })
  })
})

it('최대 대출 5,000만원 기준 필요 담보와 추가 인출 가능액을 계산한다', () => {
  expect(MAX_LOAN_KRW).toBe(50_000_000)
  expect(Math.round(requiredCollateral)).toBe(83_333_333)
  expect(withdrawableExcess(80_000_000)).toBe(0)
  expect(withdrawableExcess(83_333_333)).toBe(0)
  expect(withdrawableExcess(84_000_000)).toBe(666_666)
  expect(withdrawableExcess(0)).toBe(0)
})
