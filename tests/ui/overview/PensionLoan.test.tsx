import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PensionLoan } from '../../../src/ui/overview/PensionLoan'

afterEach(cleanup)

it('담보비율과 융자비율을 계산해 가능 여부를 표시한다', () => {
  render(<PensionLoan loanAmount={12_500} collateralAmount={100_000} />)
  const region = within(screen.getByRole('region', { name: '대출현황' }))
  expect(region.getByText('대출금액').nextElementSibling).toHaveTextContent('12,500원')
  expect(region.getByText('담보비율').nextElementSibling).toHaveTextContent('800.00%')
  expect(region.getByText('담보비율').nextElementSibling).toHaveClass('text-emerald-600')
  expect(region.getByText('융자비율').nextElementSibling).toHaveTextContent('12.50%')
  expect(region.getByText('신규 대출 가능')).toBeInTheDocument()
  const collateralHelp = region.getByRole('button', { name: '담보비율 기준' })
  fireEvent.focus(collateralHelp)
  expect(screen.getByRole('tooltip')).toHaveTextContent('140%를 넘어야 합니다')
  fireEvent.blur(collateralHelp)
  const loanHelp = region.getByRole('button', { name: '융자비율 기준' })
  fireEvent.focus(loanHelp)
  expect(screen.getByRole('tooltip')).toHaveTextContent('60% 미만일 때 신규 대출이 가능합니다')
})

it('담보비율이 140% 이하이면 경고하고 신규 대출 불가를 표시한다', () => {
  render(<PensionLoan loanAmount={500} collateralAmount={500} />)
  const region = within(screen.getByRole('region', { name: '대출현황' }))
  expect(region.getByText('담보비율').nextElementSibling).toHaveTextContent('100.00%')
  expect(region.getByText('담보비율').nextElementSibling).toHaveClass('text-red-600')
  expect(region.getByText('담보비율 140% 이하')).toBeInTheDocument()
  expect(region.getByText('융자비율').nextElementSibling).toHaveTextContent('100.00%')
  expect(region.getByText('신규 대출 불가')).toBeInTheDocument()
})

it('대출이 없고 담보가 충분하면 신규 대출 가능을 표시한다', () => {
  render(<PensionLoan loanAmount={0} collateralAmount={20_000} />)
  expect(screen.getByText('대출 없음')).toBeInTheDocument()
  expect(screen.getByText('신규 대출 가능')).toBeInTheDocument()
  expect(screen.queryByText('담보비율')).not.toBeInTheDocument()
})

it('대출이 0원이라도 담보가 없으면 신규 대출 불가를 표시한다', () => {
  render(<PensionLoan loanAmount={0} collateralAmount={0} />)
  expect(screen.getByText('대출 없음')).toBeInTheDocument()
  expect(screen.getByText('신규 대출 불가')).toBeInTheDocument()
  expect(screen.queryByText('신규 대출 가능')).not.toBeInTheDocument()
})

it('대출이 0원이라도 가능금액이 1만원 미만이면 신규 대출 불가를 표시한다', () => {
  render(<PensionLoan loanAmount={0} collateralAmount={10_000} />)
  expect(screen.getByText('대출 없음')).toBeInTheDocument()
  expect(screen.getByText('신규 대출 불가')).toBeInTheDocument()
  expect(screen.queryByText('신규 대출 가능')).not.toBeInTheDocument()
})

it('펀드 평가금액이 필요 담보를 넘으면 추가 인출 가능 알림을 표시한다', () => {
  render(<PensionLoan loanAmount={500} collateralAmount={100_000_000} />)
  const region = within(screen.getByRole('region', { name: '대출현황' }))
  const notice = region.getByRole('status')
  expect(notice).toHaveClass('bg-emerald-50', 'border-emerald-200', 'text-emerald-800')
  expect(notice).toHaveTextContent('추가 매도·인출 가능: 약 16,666,666원')
  expect(notice).toHaveTextContent('펀드 평가금액이 필요 담보(약 8,333만원)를 초과했습니다')
  expect(notice.querySelector('svg')).toBeInTheDocument()
})
it('필요 담보 이하이면 추가 인출 알림을 표시하지 않는다', () => {
  render(<PensionLoan loanAmount={500} collateralAmount={80_000_000} />)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
it('대출금액 라벨에 최대 한도와 필요 담보 툴팁을 제공한다', () => {
  render(<PensionLoan loanAmount={500} collateralAmount={100_000_000} />)
  const help = screen.getByRole('button', { name: '대출금액 기준' })
  fireEvent.focus(help)
  expect(screen.getByRole('tooltip')).toHaveTextContent('최대 5,000만원')
  expect(screen.getByRole('tooltip')).toHaveTextContent('60%')
  expect(screen.getByRole('tooltip')).toHaveTextContent('8,333만원')
})
