import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IsaPlanAmountSummary } from '../../../src/ui/overview/IsaPlanAmountSummary'

describe('IsaPlanAmountSummary 이번 달 목표 행 및 차이 표시', () => {
  const plan24 = {
    startDate: '2024-11-01',
    minTargetAmountWon: 36_000_000,
    maxTargetAmountWon: 72_000_000,
  }

  it('24개월 사례: 이번 달 목표 행 순서(최소 / 50% / 최대)와 값(2,400 / 3,600 / 4,800만)', () => {
    render(<IsaPlanAmountSummary plan={plan24} totalAssets={25_200_000} today="2026-10-25" />)
    const monthBox = screen.getByTestId('isa-month-target-summary')
    expect(within(monthBox).getByText('이번 달 목표')).toBeInTheDocument()
    expect(within(monthBox).getByText('2,400')).toBeInTheDocument()
    expect(within(monthBox).getByText('3,600')).toBeInTheDocument()
    expect(within(monthBox).getByText('4,800')).toBeInTheDocument()
    expect(within(monthBox).getAllByText('만원')).toHaveLength(3)
  })

  it('차이 표시: 최소 대비 +120만, 중간 대비 -1,080만, 최대 대비 -2,280만 순서로 표시', () => {
    render(<IsaPlanAmountSummary plan={plan24} totalAssets={25_200_000} today="2026-10-25" />)
    expect(screen.getByText('최소 대비')).toBeInTheDocument()
    expect(screen.getByText('+120만')).toBeInTheDocument()
    expect(screen.getByText('중간 대비')).toBeInTheDocument()
    expect(screen.getByText('-1,080만')).toBeInTheDocument()
    expect(screen.getByText('최대 대비')).toBeInTheDocument()
    expect(screen.getByText('-2,280만')).toBeInTheDocument()
  })

  it('목표 없음 처리: 최소 또는 최대가 없으면 해당 칸과 중간 칸을 목표 없음으로 표시', () => {
    const onlyMin = { startDate: '2026-01-01', minTargetAmountWon: 36_000_000, maxTargetAmountWon: null }
    render(<IsaPlanAmountSummary plan={onlyMin} totalAssets={10_000_000} today="2026-10-25" />)
    expect(screen.getAllByText('목표 없음').length).toBeGreaterThanOrEqual(2)
  })

  it('E·F. 시작일이 없으면 차이 줄에 시작일 필요 문구를 표시한다', () => {
    const noStart = { minTargetAmountWon: 36_000_000, maxTargetAmountWon: 72_000_000 }
    render(<IsaPlanAmountSummary plan={noStart} totalAssets={25_200_000} today="2026-10-25" />)
    expect(screen.getAllByText('시작일 필요').length).toBeGreaterThanOrEqual(1)
  })

  it('시작일 미래 + 최대 null + 평가액 2520만 → 최대 줄 목표 없음, +2520만 없음', () => {
    const plan = { startDate: '2026-11-01', minTargetAmountWon: 36_000_000, maxTargetAmountWon: null }
    render(<IsaPlanAmountSummary plan={plan} totalAssets={25_200_000} today="2026-10-25" />)
    expect(screen.queryByText('+2,520만')).not.toBeInTheDocument()
    expect(screen.getAllByText('목표 없음').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('시작 전')).toBeInTheDocument()
  })

  it('시작일 미래 + 목표 모두 있음 → 차이 줄은 시작 전', () => {
    const plan = { startDate: '2026-11-01', minTargetAmountWon: 36_000_000, maxTargetAmountWon: 72_000_000 }
    render(<IsaPlanAmountSummary plan={plan} totalAssets={25_200_000} today="2026-10-25" />)
    expect(screen.getAllByText('시작 전')).toHaveLength(3)
  })

  it('모바일에서 이번 달 목표 행이 쌍(최소/50%/최대) 단위로 줄바꿈되고 데스크톱 클래스를 갖는다', () => {
    render(<IsaPlanAmountSummary plan={plan24} totalAssets={25_200_000} today="2026-10-25" />)
    const pairs = screen.getAllByTestId('month-target-pair')
    expect(pairs).toHaveLength(3)
    expect(screen.getByText('최소')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('최대')).toBeInTheDocument()
    const container = pairs[0].parentElement
    expect(container).toHaveClass('flex-col', 'min-[769px]:flex-row', 'gap-2')
  })
})
