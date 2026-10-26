import { expect, it } from 'vitest'
import {
  ceilToStep, clamp, floorToStep, isNonNegativeSafeInteger,
  isPositiveSafeInteger, percentOfRounded, round2,
} from '../../../src/domain/shared/numbers'

it.each([
  [0, false, true], [1, true, true], [-1, false, false], [0.1, false, false],
  [NaN, false, false], [Infinity, false, false], ['1', false, false],
  [null, false, false], [undefined, false, false],
  [Number.MAX_SAFE_INTEGER, true, true], [Number.MAX_SAFE_INTEGER + 1, false, false],
])('安全 정수 %s', (value, positive, nonnegative) => {
  expect(isPositiveSafeInteger(value)).toBe(positive)
  expect(isNonNegativeSafeInteger(value)).toBe(nonnegative)
})
it('비중의 0 분모와 연산 순서 및 범위 초과를 유지한다', () => {
  expect(percentOfRounded(10, 0)).toBe(0)
  expect(percentOfRounded(1, 3)).toBe(33.33)
  expect(percentOfRounded(2, 1)).toBe(200)
  expect(round2(70.004)).toBe(70)
  expect(round2(-0.001)).toBe(-0)
  expect(round2(NaN)).toBeNaN()
})
it.each([[-1, 0], [0, 0], [50, 50], [100, 100], [101, 100]])(
  'clamp %s → %s', (value, expected) => expect(clamp(value, 0, 100)).toBe(expected),
)
it('clamp는 NaN을 전파하며 동일 양끝을 허용한다', () => {
  expect(clamp(NaN, 0, 100)).toBeNaN()
  expect(clamp(5, 2, 2)).toBe(2)
})
it.each([[499, 0, 500], [500, 500, 500], [501, 500, 1000], [-1, -500, -0]])(
  'step 내림/올림 %s', (value, floor, ceil) => {
    expect(floorToStep(value, 500)).toBe(floor)
    expect(ceilToStep(value, 500)).toBe(ceil)
  },
)
