import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../app/accounts/client'
import { toast } from 'sonner'
import { AddAccountDialog } from './AddAccountDialog'

vi.mock('../../app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const createAccount = vi.mocked(client.createAccount)

const renderDialog = (onClose = vi.fn()) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><AddAccountDialog open onClose={onClose} /></QueryClientProvider>)
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('AddAccountDialog', () => {
  it('Secret Key는 password 입력이고 빈 값이면 저장하지 않는다', async () => {
    renderDialog()
    expect(screen.getByLabelText('Secret Key')).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(createAccount).not.toHaveBeenCalled())
  })

  it('503이면 저장소 미설정 안내 toast를 표시한다', async () => {
    createAccount.mockRejectedValueOnce(Object.assign(new Error('unavailable'), { response: { status: 503 } }))
    renderDialog()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '주계좌' } })
    fireEvent.change(screen.getByLabelText('계좌번호'), { target: { value: '123-456' } })
    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('저장소가 아직 설정되지 않았습니다'))
  })
})
