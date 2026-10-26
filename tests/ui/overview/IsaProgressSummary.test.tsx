import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IsaProgressSummary } from '../../../src/ui/overview/IsaProgressSummary'
import { typeScale } from '../../../src/ui/styles/type-scale'

describe('IsaProgressSummary typography & unit separation', () => {
  const position = {
    isValid: true,
    rangePosition: 50.5,
    minAchievement: 80.2,
    maxAchievement: 120.4,
    midTarget: 25_000_000,
    isEqualTarget: false,
    status: 'within' as const,
    minZero: false,
    maxZero: false,
  }

  it('평가금액 숫자와 만원 단위를 분리하고 숫자는 number, 단위는 caption 역할을 갖는다', () => {
    render(<IsaProgressSummary currentAssets={25_000_000} position={position} />)
    const numEl = screen.getByText('2,500')
    expect(numEl).toHaveClass(...typeScale.number.split(' '))
    const unitEl = screen.getByText('만원')
    expect(unitEl).toHaveClass(...typeScale.caption.split(' '))
  })

  it('달성률 행에서 숫자와 % 단위를 분리하고 숫자는 number 역할을 갖는다', () => {
    render(<IsaProgressSummary currentAssets={25_000_000} position={position} />)
    const minAch = screen.getByText('80.2')
    expect(minAch).toHaveClass(...typeScale.number.split(' '))
    const maxAch = screen.getByText('120.4')
    expect(maxAch).toHaveClass(...typeScale.number.split(' '))
  })
})
