import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { isaText } from '../../../src/ui/glossary/isa'
import { IsaTermDialog } from '../../../src/ui/overview/IsaTermDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), setProductPlan: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const setProductPlan = vi.mocked(client.setProductPlan)
const onClose = vi.fn()
const plan = { startDate: '2024-03-15', minTargetAmountWon: null, maxTargetAmountWon: null }

function show(withPlan = false) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <IsaTermDialog accountId="a1" plan={withPlan ? plan : undefined} open onClose={onClose} />
    </QueryClientProvider>,
  )
}
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('IsaTermDialog', () => {
  it('계획이 없으면 입력 제목을 쓰고 빈 시작일은 검증 메시지를 표시한다', () => {
    show()
    expect(screen.getByRole('dialog', { name: isaText.addTitle })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    expect(screen.getByRole('alert')).toHaveTextContent(isaText.required)
    expect(setProductPlan).not.toHaveBeenCalled()
  })

  it('기존 값을 채우고 유효한 날짜의 만기일을 미리 보여준다', () => {
    show(true)
    expect(screen.getByRole('dialog', { name: isaText.editTitle })).toBeInTheDocument()
    const input = screen.getByLabelText(isaText.startDate)
    expect(input).toHaveValue('2024-03-15')
    fireEvent.change(input, { target: { value: '2025-01-15' } })
    expect(screen.getByText('만기일 2028.01.15')).toBeInTheDocument()
  })

  it('저장하면 null 금액을 포함한 원 단위 계획으로 호출하고 성공 시 닫는다', async () => {
    setProductPlan.mockResolvedValueOnce({} as never)
    show(true)
    fireEvent.change(screen.getByLabelText(isaText.startDate), { target: { value: '2025-01-15' } })
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    await waitFor(() => expect(setProductPlan).toHaveBeenCalledWith('a1', '01', {
      startDate: '2025-01-15', minTargetAmountWon: null, maxTargetAmountWon: null,
    }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(toast).toHaveBeenCalledWith(isaText.saved)
  })

  it('저장 중에는 버튼을 비활성화하고 저장 중 문구를 표시한다', async () => {
    setProductPlan.mockReturnValueOnce(new Promise(() => {}))
    show(true)
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    expect(await screen.findByRole('button', { name: isaText.saving })).toBeDisabled()
  })

  it('저장에 실패하면 모달을 유지하고 toast로 알린다', async () => {
    setProductPlan.mockRejectedValueOnce(new Error('boom'))
    show(true)
    fireEvent.click(screen.getByRole('button', { name: isaText.save }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(isaText.saveFailed))
    expect(onClose).not.toHaveBeenCalled()
  })
})
