import { describe, expect, it } from 'vitest'
import { COLLATERAL_MIN_PERCENT, LOAN_MIN_AVAILABLE_KRW, MAX_LOAN_KRW, NEW_LOAN_MAX_PERCENT, loanRatios, requiredCollateral, withdrawableExcess } from '../../../src/app/kis/loan-ratios'

const ratios = (loanAmount: number, collateralAmount: number) => loanRatios({ loanAmount, collateralAmount })

describe('loanRatios', () => {
  it('담보비율 140.00%이면 충족하지 않는다', () => {
    const result = ratios(1000, 1400)
    expect(result.collateralRatio).toBe(140)
    expect(result.collateralOk).toBe(false)
    expect(COLLATERAL_MIN_PERCENT).toBe(140)
  })

  it('담보비율 140.01%이면 충족한다', () => {
    expect(ratios(10000, 14001).collateralOk).toBe(true)
  })

  it('융자비율 59%이고 가능금액이 9,999원이면 불가능하다', () => {
    const result = ratios(589_941, 999_900)
    expect(result.loanRatio).toBe(59)
    expect(result.availableLoanKrw).toBe(9_999)
    expect(result.newLoanAvailable).toBe(false)
  })

  it('융자비율 59%이고 가능금액이 10,000원이면 가능하다', () => {
    const result = ratios(590_000, 1_000_000)
    expect(result.loanRatio).toBe(59)
    expect(result.availableLoanKrw).toBe(10_000)
    expect(result.newLoanAvailable).toBe(true)
    expect(LOAN_MIN_AVAILABLE_KRW).toBe(10_000)
  })

  it('융자비율이 60% 미만이어도 가능금액이 1만원 미만이면 불가능하다', () => {
    const result = ratios(599.9, 1000)
    expect(result.loanRatio).toBe(59.99)
    expect(result.newLoanAvailable).toBe(false)
  })

  it('표시값이 60%로 반올림되어도 가능금액이 1만원 미만이면 불가능하다', () => {
    const result = ratios(599.99, 1000)
    expect(result.loanRatio).toBe(60)
    expect(result.newLoanAvailable).toBe(false)
  })

  it('융자비율 60%이면 가능금액과 무관하게 불가능하다', () => {
    const result = ratios(600_000, 1_000_000)
    expect(result.loanRatio).toBe(60)
    expect(result.availableLoanKrw).toBe(0)
    expect(result.newLoanAvailable).toBe(false)
    expect(NEW_LOAN_MAX_PERCENT).toBe(60)
  })

  it('융자 0원이어도 담보가 0이면 불가능하다', () => {
    expect(ratios(0, 0)).toEqual({
      collateralRatio: null, loanRatio: 0, collateralOk: true, availableLoanKrw: 0, newLoanAvailable: false,
    })
  })

  it('융자 0원이고 담보가 충분하면 가능금액 기준으로 가능하다', () => {
    const result = ratios(0, 1_000_000)
    expect(result.availableLoanKrw).toBe(600_000)
    expect(result.newLoanAvailable).toBe(true)
  })

  it('가능금액은 최대 5,000만원 한도로 잘린다', () => {
    const result = ratios(49_990_000, 100_000_000)
    expect(result.availableLoanKrw).toBe(10_000)
    expect(result.newLoanAvailable).toBe(true)
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
