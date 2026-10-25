import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { isaText } from '../../../src/ui/glossary/isa'
import { IsaTermDialog } from '../../../src/ui/overview/IsaTermDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), setProductPlan: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const setProductPlan = vi.mocked(client.setProductPlan)
const plan = { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null }

function show() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <IsaTermDialog accountId="a1" plan={plan} open onClose={vi.fn()} />
    </QueryClientProvider>,
  )
}
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('IsaTermDialog 목표금액', () => {
  it('만원 단위 기존 금액을 채우고 0 이상 정수 입력 속성을 준다', () => {
    show()
    const min = screen.getByLabelText(isaText.minTarget)
    expect(min).toHaveValue(1250)
    expect(min).toHaveAttribute('min', '0')
    expect(min).toHaveAttribute('step', '1')
    expect(screen.getByLabelText(isaText.maxTarget)).toHaveValue(null)
  })

  it('음수·소수는 각 금액 오류로 거부한다', () => {
    show()
    fireEvent.change(screen.getByLabelText(isaText.minTarget), { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    expect(screen.getByRole('alert')).toHaveTextContent(isaText.minTargetInvalid)
    fireEvent.change(screen.getByLabelText(isaText.minTarget), { target: { value: '1.5' } })
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    expect(screen.getByRole('alert')).toHaveTextContent(isaText.minTargetInvalid)
    expect(setProductPlan).not.toHaveBeenCalled()
  })

  it('최소가 최대를 넘으면 범위 오류를 표시한다', () => {
    show()
    fireEvent.change(screen.getByLabelText(isaText.minTarget), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(isaText.maxTarget), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    expect(screen.getByRole('alert')).toHaveTextContent(isaText.targetRangeInvalid)
    expect(setProductPlan).not.toHaveBeenCalled()
  })

  it('만원 입력을 원 정수로 환산해 저장한다', async () => {
    setProductPlan.mockResolvedValueOnce({} as never)
    show()
    fireEvent.change(screen.getByLabelText(isaText.maxTarget), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    await waitFor(() => expect(setProductPlan).toHaveBeenCalledWith('a1', '01', {
      startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: 25_000_000,
    }))
  })
})
