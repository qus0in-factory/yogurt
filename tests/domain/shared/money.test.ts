import { expect, it } from 'vitest'
import { manwonToWon, roundWonToManwon, wonToManwon } from '../../../src/domain/shared/money'

it.each([[4999, 0], [5000, 1], [15000, 2], [-5000, -0]] as const)(
  '원 %s의 만원 변환과 반올림을 구분한다', (won, rounded) => {
    expect(wonToManwon(won)).toBe(won / 10000)
    expect(roundWonToManwon(won)).toBe(rounded)
  },
)
it('소수 만원과 안전 정수 경계를 임의 정규화하지 않는다', () => {
  expect(manwonToWon(1.25)).toBe(12500)
  expect(wonToManwon(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER / 10000)
  expect(manwonToWon(Infinity)).toBe(Infinity)
  expect(wonToManwon(NaN)).toBeNaN()
})
