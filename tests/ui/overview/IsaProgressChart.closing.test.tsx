import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IsaProgressChart } from '../../../src/ui/overview/IsaProgressChart'

describe('IsaProgressChart closing value', () => {
  const points = [
    { month: '2026-07', min: 14_000_000, mid: 21_000_000, max: 28_000_000 },
    { month: '2026-08', min: 16_000_000, mid: 24_000_000, max: 32_000_000 },
    { month: '2026-09', min: 18_000_000, mid: 27_000_000, max: 36_000_000 },
  ]

  it('만기 월에 직전 월 마감 값이 있으면 점과 값·날짜를 표시한다', () => {
    const { container } = render(
      <IsaProgressChart
        currentAssets={25_200_000}
        points={points}
        hasMid={true}
        currentMonth="2026-09"
        expiryMonth="2026-09"
        lastClose={{ date: '2026-09-30', totalAssetsWon: 25_200_000 }}
      />
    )
    expect(container.querySelector('circle[data-testid="last-close-dot"]')).toBeInTheDocument()
    expect(screen.getByText('2520만')).toBeInTheDocument()
    expect(screen.getByText('2026-09-30')).toBeInTheDocument()
    expect(screen.queryByTestId('closing-wait')).not.toBeInTheDocument()
  })

  it('만기 월에 마감 기록이 없으면 마감 기록 대기 문구를 표시한다', () => {
    const { container } = render(
      <IsaProgressChart
        currentAssets={25_200_000}
        points={points}
        hasMid={true}
        currentMonth="2026-09"
        expiryMonth="2026-09"
        lastClose={null}
      />
    )
    expect(container.querySelector('circle[data-testid="last-close-dot"]')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-wait')).toHaveTextContent('마감 기록 대기')
  })

  it('만기 월에 로딩 중이면 로딩 문구를 표시한다', () => {
    render(
      <IsaProgressChart
        currentAssets={25_200_000}
        points={points}
        hasMid={true}
        currentMonth="2026-09"
        expiryMonth="2026-09"
        isLoadingLastClose={true}
      />
    )
    expect(screen.getByTestId('closing-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('closing-wait')).not.toBeInTheDocument()
  })

  it('만기 월이 아니면 lastClose가 있어도 기존 현재 점이 유지된다', () => {
    const { container } = render(
      <IsaProgressChart
        currentAssets={25_200_000}
        points={points}
        hasMid={true}
        currentMonth="2026-08"
        expiryMonth="2026-09"
        lastClose={{ date: '2026-09-30', totalAssetsWon: 25_200_000 }}
      />
    )
    expect(container.querySelector('circle[data-testid="current-dot"]')).toBeInTheDocument()
    expect(container.querySelector('circle[data-testid="last-close-dot"]')).not.toBeInTheDocument()
    expect(screen.queryByText('2026-09-30')).not.toBeInTheDocument()
  })
})
