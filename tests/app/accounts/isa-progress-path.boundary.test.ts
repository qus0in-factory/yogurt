import { expect, it } from 'vitest'
import { calculateAxisRange, calculateProgressPath } from '../../../src/app/accounts/isa-progress-path'

it('k=0/1/36과 만기 이후의 경로를 원 단위로 검증한다', () => {
  const result = calculateProgressPath({
    startDate: '2024-01-15', minTarget: 36_000_000, maxTarget: 72_000_000,
    months: ['2023-12', '2024-01', '2026-12', '2027-01'],
  })
  expect(result).toEqual({ hasMid: true, points: [
    { month: '2023-12', min: 0, mid: 0, max: 0 },
    { month: '2024-01', min: 1_000_000, mid: 1_500_000, max: 2_000_000 },
    { month: '2026-12', min: 36_000_000, mid: 54_000_000, max: 72_000_000 },
    { month: '2027-01', min: 36_000_000, mid: 54_000_000, max: 72_000_000 },
  ] })
})

it.each([
  [null, null, null, null, null],
  [36, null, 1, null, null],
  [null, 72, null, null, 2],
  [36, 36, 1, null, 1],
  [-36, -72, 0, null, 0],
] as const)('목표 %s/%s의 시작점과 중앙선', (minTarget, maxTarget, min, mid, max) => {
  expect(calculateProgressPath({ minTarget, maxTarget, months: ['2026-01'] })).toEqual({
    hasMid: false, points: [{ month: '2026-01', min, mid, max }],
  })
})

it('기간이 비어 있으면 빈 경로이며 입력 기간을 변경하지 않는다', () => {
  expect(calculateProgressPath({ minTarget: 1, maxTarget: 2, months: [] })).toEqual({
    points: [], hasMid: true,
  })
  const months = Array.from({ length: 37 }, (_, i) => `month-${i}`)
  const before = [...months]
  const { points } = calculateProgressPath({ minTarget: 36, maxTarget: 72, months })
  expect(points[35]).toMatchObject({ min: 36, mid: 54, max: 72 })
  expect(points[36]).toMatchObject({ min: 36, mid: 54, max: 72 })
  expect(months).toEqual(before)
})

it.each([
  [10_000_000, 500, 1500],
  [10_000_001, 500, 2000],
  [15_000_000, 1000, 2000],
  [0, 500, 1000],
] as const)('현재액 %i의 500만원 축 경계', (amount, minManwon, maxManwon) => {
  const expected = Array.from({ length: (maxManwon - minManwon) / 500 + 1 }, (_, i) => minManwon + i * 500)
  expect(calculateAxisRange(amount)).toEqual({ minManwon, maxManwon, ticks: expected })
  expect(calculateAxisRange([amount])).toEqual({ minManwon, maxManwon, ticks: expected })
})

it('null 목표 끝점은 건너뛰어 첫 하단과 마지막 상단을 사용한다', () => {
  const points = [
    { month: '2026-01', min: null, mid: null, max: null },
    { month: '2026-02', min: 15_000_000, mid: null, max: 25_000_000 },
    { month: '2026-03', min: null, mid: null, max: null },
  ]
  expect(calculateAxisRange(20_000_000, points)).toEqual({
    minManwon: 1000, maxManwon: 3000, ticks: [1000, 1500, 2000, 2500, 3000],
  })
})
