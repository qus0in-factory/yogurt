// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { RebalanceBlockNotice } from '../../../../src/ui/operations/rebalance/RebalanceBlockNotice'
import { RebalanceMarketNotice } from '../../../../src/ui/operations/rebalance/RebalanceMarketNotice'
import { RebalancePriceWarning } from '../../../../src/ui/operations/rebalance/RebalancePriceWarning'
import { rebalanceText } from '../../../../src/ui/glossary/rebalance'

afterEach(cleanup)

it('차단 안내는 짧은 라벨과 아이콘+aria로 표시하고 긴 문장을 셀에 쓰지 않는다', () => {
  render(<RebalanceBlockNotice reason="keep" />)
  const notice = screen.getByRole('status', { name: rebalanceText.keepLoadBlocked })
  expect(notice.querySelector('svg')).not.toBeNull()
  expect(screen.getByText('남길')).toBeInTheDocument()
  expect(screen.queryByText(rebalanceText.keepLoadBlocked)).not.toBeInTheDocument()
})

it('시세 실패 안내는 짧은 라벨과 아이콘+aria로 표시한다', () => {
  render(<RebalancePriceWarning inputs={{ priceFailed: ['005930'], targets: [], holdings: [] }} />)
  const message = rebalanceText.priceFailed('005930')
  const notice = screen.getByRole('status', { name: message })
  expect(notice.querySelector('svg')).not.toBeNull()
  expect(screen.getByText('시세')).toBeInTheDocument()
  expect(screen.queryByText(message)).not.toBeInTheDocument()
})

it('장 마감 안내는 짧은 라벨과 툴팁 aria로 표시한다', () => {
  render(<RebalanceMarketNotice status={{ open: false, reason: 'closed-hours', nextOpenAt: '2026-10-28T00:00:00.000Z' }} />)
  const notice = screen.getByRole('status')
  expect(notice).toHaveAccessibleName(/장 마감 시간/)
  expect(notice.querySelector('svg')).not.toBeNull()
  expect(screen.getByText('마감')).toBeInTheDocument()
  expect(screen.queryByText(/장 마감 시간/)).not.toBeInTheDocument()
})
