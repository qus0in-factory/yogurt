import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { toast } from 'sonner'
import { AddAccountDialog } from '../../../src/ui/accounts/AddAccountDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const createAccount = vi.mocked(client.createAccount)

const renderDialog = (onClose = vi.fn()) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><AddAccountDialog open onClose={onClose} /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})
afterEach(cleanup)

describe('AddAccountDialog', () => {
  it('Secret Key는 password 입력이고 빈 값이면 저장하지 않는다', async () => {
    renderDialog()
    expect(screen.getByLabelText('Secret Key')).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(createAccount).not.toHaveBeenCalled())
    expect(await screen.findByText('소유자를 입력하세요')).toBeInTheDocument()
  })

  it('503이면 저장소 미설정 안내 toast를 표시한다', async () => {
    createAccount.mockRejectedValueOnce(Object.assign(new Error('unavailable'), { response: { status: 503 } }))
    renderDialog()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '주계좌' } })
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '김철수' } })
    fireEvent.change(screen.getByLabelText('계좌번호'), { target: { value: '123-456' } })
    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('저장소가 아직 설정되지 않았습니다'))
  })

  it('별칭·소유자·계좌번호 초안을 sessionStorage에 저장하고 다시 열면 복원한다', async () => {
    renderDialog()
    for (const [label, value] of [['별칭', '초안별칭'], ['소유자', '초안소유자'], ['계좌번호', '999-000']]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } })
    }
    await waitFor(() => expect(JSON.stringify(sessionStorage)).toContain('초안소유자'))
    cleanup()
    renderDialog()
    for (const [label, value] of [['별칭', '초안별칭'], ['소유자', '초안소유자'], ['계좌번호', '999-000']]) {
      expect(screen.getByLabelText(label)).toHaveValue(value)
    }
  })

  it('Access Key·Secret Key는 sessionStorage 어디에도 저장하지 않는다', async () => {
    renderDialog()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: 'x' } })
    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AKTEST' } })
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SKTEST' } })
    await waitFor(() => expect(sessionStorage.getItem('yogurt:account-draft')).not.toBeNull())
    const dump = JSON.stringify(sessionStorage)
    expect(dump).not.toContain('AKTEST'); expect(dump).not.toContain('SKTEST')
  })

  it('저장 성공 시 초안을 삭제한다', async () => {
    createAccount.mockResolvedValueOnce({ id: 'a2', alias: '새 계좌', owner: '김철수', accountNumber: '111-222', createdAt: '2026-01-01T00:00:00.000Z' })
    renderDialog()
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '새 계좌' } })
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '김철수' } })
    fireEvent.change(screen.getByLabelText('계좌번호'), { target: { value: '111-222' } })
    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
    await waitFor(() => expect(sessionStorage.getItem('yogurt:account-draft')).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(sessionStorage.getItem('yogurt:account-draft')).toBeNull())
  })
})
