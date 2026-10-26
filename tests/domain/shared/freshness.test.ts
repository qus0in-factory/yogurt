import { expect, it } from 'vitest'
import { isFreshSeoulMinute, SEVEN_DAYS_MS } from '../../../src/domain/shared/freshness'

it.each([[0, true], [604800000, true], [604800001, false], [-1, false]])(
  '캐시 나이 %s 경계', (age, expected) => {
    const saved = Date.parse('2026-10-18T10:00:00+09:00')
    expect(isFreshSeoulMinute('2026-10-18 10:00', new Date(saved + age), SEVEN_DAYS_MS)).toBe(expected)
  },
)
it('잘못된 시각과 유효하지 않은 현재 시각은 거부한다', () => {
  expect(SEVEN_DAYS_MS).toBe(604800000)
  expect(isFreshSeoulMinute('invalid', new Date(), SEVEN_DAYS_MS)).toBe(false)
  expect(isFreshSeoulMinute('2026-10-18 10:00', new Date(NaN), SEVEN_DAYS_MS)).toBe(false)
})
