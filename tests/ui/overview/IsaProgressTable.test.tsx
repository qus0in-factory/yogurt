import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { IsaProgressTable } from '../../../src/ui/overview/IsaProgressTable'
import { typeScale } from '../../../src/ui/styles/type-scale'

describe('IsaProgressTable typography', () => {
  const points = [
    { month: '2026-08', min: 16_000_000, mid: 24_000_000, max: 32_000_000 },
  ]

  it('표 본문에서 전체 caption 대신 금액 셀은 number 역할과 분리된 단위를 사용한다', () => {
    const { container } = render(<IsaProgressTable points={points} hasMid={true} />)
    const tbody = container.querySelector('tbody')
    expect(tbody).not.toHaveClass(...typeScale.caption.split(' '))
    const num = screen.getByText('1,600')
    expect(num).toHaveClass(...typeScale.number.split(' '))
    const units = screen.getAllByText('만원')
    expect(units[0]).toHaveClass(...typeScale.caption.split(' '))
  })
})
