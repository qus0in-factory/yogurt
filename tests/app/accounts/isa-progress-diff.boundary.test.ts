import { expect, it } from 'vitest'
import { calculateCurrentMonthTargets, formatDiffManwon } from '../../../src/app/accounts/isa-progress-diff'

const labels = ['만원', '목표 없음', '시작일 필요', '시작 전'] as const
const calculate = (min: number | null, max: number | null, assets: number | null) =>
  calculateCurrentMonthTargets('2026-01-01', '2026-01-01', min, max, assets, ...labels)

it.each([Infinity, -Infinity])('비유한 차이 %s는 숫자로 표시하지 않는다', (diff) => {
  expect(formatDiffManwon(diff, labels[0], labels[1])).toBe(labels[1])
})

it.each([[4999, '0만원'], [5000, '+1만원'], [-5001, '-1만원']] as const)(
  '만원 반올림 경계 %s → %s', (diff, text) => {
    expect(formatDiffManwon(diff, labels[0], labels[1])).toBe(text)
  },
)

it.each([null, NaN, Infinity, -Infinity])('평가액 %s라도 목표값은 보존하고 차이는 숨긴다', (assets) => {
  const result = calculate(360_000, 720_000, assets)
  expect(result).toMatchObject({
    k: 1, minTargetWon: 10000, midTargetWon: 15000, maxTargetWon: 20000,
    minDiffText: labels[1], midDiffText: labels[1], maxDiffText: labels[1],
  })
})

it('최소 목표만 없으면 최대 차이는 계산하고 중앙 목표는 만들지 않는다', () => {
  expect(calculate(null, 720_000, 30000)).toMatchObject({
    minTargetWon: null, midTargetWon: null, maxTargetWon: 20000,
    minDiffText: labels[1], midDiffText: labels[1], maxDiffText: '+1만원',
  })
})

it('양쪽 목표가 없으면 평가액이 있어도 모두 목표 없음이다', () => {
  expect(calculate(null, null, 30000)).toMatchObject({
    minTargetWon: null, midTargetWon: null, maxTargetWon: null,
    minDiffText: labels[1], midDiffText: labels[1], maxDiffText: labels[1],
  })
})

it('목표 0과 평가액 0은 누락이 아니며 동일 목표의 차이는 0이다', () => {
  expect(calculate(0, 0, 0)).toMatchObject({
    minTargetWon: 0, midTargetWon: 0, maxTargetWon: 0,
    minDiffText: '0만원', midDiffText: '0만원', maxDiffText: '0만원',
  })
  expect(calculate(360_000, 360_000, 10000).midDiffText).toBe('0만원')
})

it('시작 월 안이라도 시작일 직전이면 k=0이고 시작 전이다', () => {
  const result = calculateCurrentMonthTargets('2026-01-15', '2026-01-14', 36, 72, 100, ...labels)
  expect(result).toMatchObject({
    k: 0, minTargetWon: 0, midTargetWon: 0, maxTargetWon: 0,
    minDiffText: labels[3], midDiffText: labels[3], maxDiffText: labels[3],
  })
})

it('36개월 이후에도 목표를 초과 적립하지 않는다', () => {
  const result = calculateCurrentMonthTargets('2023-01-01', '2026-02-01', 360000, 720000, 720000, ...labels)
  expect(result).toMatchObject({
    k: 36, minTargetWon: 360000, midTargetWon: 540000, maxTargetWon: 720000,
    minDiffText: '+36만원', midDiffText: '+18만원', maxDiffText: '0만원',
  })
})
