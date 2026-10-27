import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RebalanceMarketNotice } from '../../../../src/ui/operations/rebalance/RebalanceMarketNotice'

afterEach(cleanup)

describe('RebalanceMarketNotice', () => {
  it('장 중이면 아무 안내도 렌더링하지 않는다', () => {
    const { container } = render(<RebalanceMarketNotice status={{ open: true, reason: 'open', nextOpenAt: '2026-10-28T00:00:00.000Z' }} />)
    expect(container.firstChild).toBeNull()
  })

  it('마감 시간이면 사유(장 마감 시간)와 다음 개장 시각(한국 시간)을 표시한다', () => {
    render(<RebalanceMarketNotice status={{ open: false, reason: 'closed-hours', nextOpenAt: '2026-10-28T00:00:00.000Z' }} />)
    const notice = screen.getByRole('status')
    expect(notice).toHaveAccessibleName(/장 마감 시간/)
    expect(notice).toHaveAccessibleName(/2026\.10\.28 09:00 \(한국 시간\)/)
  })

  it('주말이면 사유(주말)와 다음 개장 시각(한국 시간)을 표시한다', () => {
    render(<RebalanceMarketNotice status={{ open: false, reason: 'weekend', nextOpenAt: '2026-10-26T00:00:00.000Z' }} />)
    const notice = screen.getByRole('status')
    expect(notice).toHaveAccessibleName(/주말/)
    expect(notice).toHaveAccessibleName(/2026\.10\.26 09:00 \(한국 시간\)/)
  })

  it('휴장일이면 사유(휴장일)와 다음 개장 시각(한국 시간)을 표시한다', () => {
    render(<RebalanceMarketNotice status={{ open: false, reason: 'holiday', nextOpenAt: '2026-10-29T00:00:00.000Z' }} />)
    const notice = screen.getByRole('status')
    expect(notice).toHaveAccessibleName(/휴장일/)
    expect(notice).toHaveAccessibleName(/2026\.10\.29 09:00 \(한국 시간\)/)
  })

  it('장 상태 조회 실패 시 안전하게 오류 메시지를 표시한다', () => {
    render(<RebalanceMarketNotice isError />)
    const notice = screen.getByRole('status')
    expect(notice).toHaveAccessibleName('장 상태를 확인할 수 없습니다')
    expect(screen.queryByText('장 상태를 확인할 수 없습니다')).not.toBeInTheDocument()
  })
})
