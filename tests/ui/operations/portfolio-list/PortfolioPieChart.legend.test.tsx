// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Portfolio } from '../../../../src/domain/portfolio/portfolio'
import { PortfolioPieChart } from '../../../../src/ui/operations/portfolio-list/PortfolioPieChart'
import { typeScale } from '../../../../src/ui/styles/type-scale'

afterEach(cleanup)

const testPortfolio: Portfolio = {
  id: 'p-test',
  name: '테스트 포트폴리오',
  createdAt: '2026-10-26',
  updatedAt: '2026-10-26',
  items: [
    { kind: 'security', stockCode: '005930', stockName: '매우긴종목이름입니다말줄임표시를테스트합니다', targetWeightBps: 8000 },
    { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 2000 },
  ],
}

describe('PortfolioPieChart 범례 스타일', () => {
  it('종목명(본문)과 비율(숫자) 요소의 클래스가 다르고 각각 본문과 숫자 역할을 가진다', () => {
    render(<PortfolioPieChart portfolio={testPortfolio} />)
    const listItems = screen.getAllByRole('listitem')
    const firstItem = listItems[0]

    const labelEl = within(firstItem).getByText('매우긴종목이름입니다말줄임표시를테스트합니다')
    const weightEl = within(firstItem).getByText('80.00%')

    expect(labelEl).toHaveClass('text-stone-700')
    expect(labelEl.className).not.toEqual(weightEl.className)
    expect(weightEl).toHaveClass('tabular-nums')
    expect(weightEl).toHaveClass('text-primary-700')
  })

  it('비율 요소에 tabular-nums 와 오른쪽 정렬이 있다', () => {
    render(<PortfolioPieChart portfolio={testPortfolio} />)
    const weightEl = screen.getByText('80.00%')
    expect(weightEl).toHaveClass('tabular-nums')
    expect(weightEl).toHaveClass('text-right')
  })

  it('긴 종목명 요소에 truncate 클래스가 있다', () => {
    render(<PortfolioPieChart portfolio={testPortfolio} />)
    const labelEl = screen.getByText('매우긴종목이름입니다말줄임표시를테스트합니다')
    expect(labelEl).toHaveClass('truncate')
  })

  it('기존 범례 텍스트 기대(종목명과 % 표시)를 그대로 충족한다', () => {
    render(<PortfolioPieChart portfolio={testPortfolio} />)
    expect(screen.getByText('현금/예수금 20.00%')).toBeInTheDocument()
    expect(screen.getByText(/매우긴종목이름입니다말줄임표시를테스트합니다 80\.00%/)).toBeInTheDocument()
  })
})
