import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IsaProgressChart } from '../../../src/ui/overview/IsaProgressChart'

describe('IsaProgressChart', () => {
  const points = [
    { month: '2026-07', min: 14_000_000, mid: 21_000_000, max: 28_000_000 },
    { month: '2026-08', min: 16_000_000, mid: 24_000_000, max: 32_000_000 },
    { month: '2026-09', min: 18_000_000, mid: 27_000_000, max: 36_000_000 },
  ]

  it('밴드와 중간 점선 경로를 렌더링하고 clipPath를 적용한다', () => {
    const { container } = render(<IsaProgressChart currentAssets={27_000_000} points={points} hasMid={true} currentMonth="2026-08" />)
    expect(screen.getByRole('img', { name: '월별 목표 진척' })).toBeInTheDocument()
    expect(container.querySelector('clipPath#chart-plot-area')).toBeInTheDocument()
    expect(container.querySelector('g[clip-path="url(#chart-plot-area)"]')).toBeInTheDocument()
    expect(container.querySelector('path[data-testid="band-path"]')).toBeInTheDocument()
  })

  it('가운데 칸의 최소·중간·최대 목표 값(만원)을 라벨로 쓴다', () => {
    render(<IsaProgressChart currentAssets={27_000_000} points={points} hasMid={true} currentMonth="2026-08" />)
    expect(screen.getByText(/1600만/)).toBeInTheDocument()
    expect(screen.getByText(/2400만/)).toBeInTheDocument()
    expect(screen.getByText(/3200만/)).toBeInTheDocument()
  })

  it('D. 현재 월이 만기 월일 때 현재 점을 그리지 않고 마감 기록 대기 문구를 표시한다', () => {
    const { container } = render(<IsaProgressChart currentAssets={30_000_000} points={points} hasMid={true} currentMonth="2026-09" expiryMonth="2026-09" />)
    expect(container.querySelector('circle[data-testid="current-dot"]')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-wait')).toHaveTextContent('마감 기록 대기')
  })

  it('위치 %가 음수일 때 최소 미달 라벨, 100% 초과일 때 최대 초과 라벨이 붙는다', () => {
    const { rerender } = render(<IsaProgressChart currentAssets={10_000_000} points={points} hasMid={true} currentMonth="2026-08" />)
    expect(screen.getByText(/최소 미달/)).toBeInTheDocument()
    rerender(<IsaProgressChart currentAssets={50_000_000} points={points} hasMid={true} currentMonth="2026-08" />)
    expect(screen.getByText(/최대 초과/)).toBeInTheDocument()
  })

  it('점 라벨 좌표가 SVG 높이(220) 안에 머물며 아래로 벗어나지 않는다', () => {
    const { container } = render(<IsaProgressChart currentAssets={18_000_000} points={points} hasMid={true} currentMonth="2026-09" />)
    const texts = Array.from(container.querySelectorAll('text'))
    for (const t of texts) {
      const y = Number(t.getAttribute('y'))
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(220)
    }
  })

  it('C·E. 임의 px(9/10px) 클래스가 없고 최소 12px(text-xs)이며 font-bold(700)를 쓰지 않는다', () => {
    const { container } = render(<IsaProgressChart currentAssets={18_000_000} points={points} hasMid={true} currentMonth="2026-09" />)
    for (const el of Array.from(container.querySelectorAll('text, tspan'))) {
      const cls = el.getAttribute('class') ?? ''
      expect(cls).not.toMatch(/text-\[(9|10)px\]/)
      expect(cls).toContain('text-xs')
      expect(cls).not.toContain('font-bold')
    }
  })

  it('모바일 폭에서 viewBox 360과 최소 높이 220px를 적용하고 데스크톱에서는 600을 유지한다', () => {
    const { container: mobile, rerender } = render(<IsaProgressChart currentAssets={18_000_000} points={points} hasMid={true} currentMonth="2026-09" wide={false} />)
    expect(mobile.querySelector('svg')).toHaveAttribute('viewBox', '0 0 360 220')
    expect(mobile.querySelector('div')).toHaveClass('min-h-[220px]')
    rerender(<IsaProgressChart currentAssets={18_000_000} points={points} hasMid={true} currentMonth="2026-09" wide={true} />)
    expect(mobile.querySelector('svg')).toHaveAttribute('viewBox', '0 0 600 220')
  })
})
