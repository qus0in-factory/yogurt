import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { toast } from 'sonner'
import { EditAccountDialog } from '../../../src/ui/accounts/EditAccountDialog'

vi.mock('../../../src/app/accounts/client', () => ({ updateAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const updateAccount = vi.mocked(client.updateAccount)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '123-456-789', createdAt: '2026-01-01T00:00:00.000Z' }

const renderDialog = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const onClose = vi.fn()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(<QueryClientProvider client={queryClient}><EditAccountDialog account={account} onClose={onClose} /></QueryClientProvider>)
  return { onClose, invalidate }
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('EditAccountDialog', () => {
  it('소유자→별칭 순서로 기존 값을 채우고 계좌번호는 읽기 전용으로 표시한다', () => {
    renderDialog()
    expect(screen.getAllByLabelText(/소유자|별칭/).map((el) => el.getAttribute('name'))).toEqual(['owner', 'alias'])
    expect(screen.getByLabelText('별칭')).toHaveValue('주계좌')
    expect(screen.getByLabelText('소유자')).toHaveValue('김철수')
    expect(screen.getByText('123-456-789')).toBeInTheDocument()
    expect(screen.queryByLabelText('계좌번호')).not.toBeInTheDocument()
  })

  it('스키마의 한글 검증 메시지를 TextField 오류로 표시한다', async () => {
    renderDialog()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('별칭을 입력하세요')).toBeInTheDocument()
    expect(screen.getByText('소유자를 입력하세요')).toBeInTheDocument()
    expect(updateAccount).not.toHaveBeenCalled()
  })

  it('저장 성공 시 닫고 목록을 무효화하며 성공 toast를 표시한다', async () => {
    updateAccount.mockResolvedValueOnce({ ...account, alias: '연금', owner: '이영희' })
    const { onClose, invalidate } = renderDialog()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '연금' } })
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '이영희' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(updateAccount).toHaveBeenCalledWith('a1', { alias: '연금', owner: '이영희' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['accounts'] })
    expect(toast).toHaveBeenCalledWith('계좌를 수정했습니다')
  })

  it('404는 찾을 수 없음, 503은 저장소 미설정, 그 외는 수정 실패 toast를 표시한다', async () => {
    const { onClose } = renderDialog()
    updateAccount.mockRejectedValueOnce(Object.assign(new Error('nf'), { response: { status: 404 } }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('계좌를 찾을 수 없습니다'))
    expect(onClose).not.toHaveBeenCalled()
    updateAccount.mockRejectedValueOnce(Object.assign(new Error('bad'), { response: { status: 400 } }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('계좌를 수정하지 못했습니다'))
    updateAccount.mockRejectedValueOnce(Object.assign(new Error('unavailable'), { response: { status: 503 } }))
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('저장소가 아직 설정되지 않았습니다'))
  })
})
