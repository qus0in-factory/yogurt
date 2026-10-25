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
const fill = (values: Record<string, string>) => {
  for (const [label, value] of Object.entries(values)) fireEvent.change(screen.getByLabelText(label), { target: { value } })
}
beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})
afterEach(cleanup)

describe('AddAccountDialog', () => {
  it('필드 순서는 소유자→별칭→계좌번호→Access Key→Secret Key다', () => {
    renderDialog()
    const names = screen.getAllByLabelText(/소유자|별칭|계좌번호|Access Key|Secret Key/).map((el) => el.getAttribute('name'))
    expect(names).toEqual(['owner', 'alias', 'accountNumber', 'accessKey', 'secretKey'])
  })

  it('Secret Key는 password 입력이고 빈 값이면 저장하지 않는다', async () => {
    renderDialog()
    expect(screen.getByLabelText('Secret Key')).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(createAccount).not.toHaveBeenCalled())
    expect(await screen.findByText('소유자를 입력하세요')).toBeInTheDocument()
  })

  it('409는 계좌번호 필드 오류로 표시하고 toast를 띄우지 않는다', async () => {
    createAccount.mockRejectedValueOnce(Object.assign(new Error('dup'), { response: { status: 409 } }))
    renderDialog()
    fill({ 소유자: '김철수', 별칭: '주계좌', 계좌번호: '12345678', 'Access Key': 'AK', 'Secret Key': 'SK' })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('이미 등록된 계좌번호입니다')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('503이면 저장소 미설정 안내 toast를 표시한다', async () => {
    createAccount.mockRejectedValueOnce(Object.assign(new Error('unavailable'), { response: { status: 503 } }))
    renderDialog()
    fill({ 소유자: '김철수', 별칭: '주계좌', 계좌번호: '12345678', 'Access Key': 'AK', 'Secret Key': 'SK' })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('저장소가 아직 설정되지 않았습니다'))
  })

  it('별칭·소유자·계좌번호 초안만 저장하고 다시 열면 복원한다', async () => {
    renderDialog()
    fill({ 별칭: '초안별칭', 소유자: '초안소유자', 계좌번호: '99900000', 'Access Key': 'AKTEST', 'Secret Key': 'SKTEST' })
    await waitFor(() => expect(JSON.stringify(sessionStorage)).toContain('초안소유자'))
    const dump = JSON.stringify(sessionStorage)
    expect(dump).not.toContain('AKTEST'); expect(dump).not.toContain('SKTEST')
    cleanup()
    renderDialog()
    expect(screen.getByLabelText('별칭')).toHaveValue('초안별칭')
    expect(screen.getByLabelText('소유자')).toHaveValue('초안소유자')
    expect(screen.getByLabelText('계좌번호')).toHaveValue('99900000')
  })

  it('저장 성공 시 초안을 삭제한다', async () => {
    createAccount.mockResolvedValueOnce({ id: 'a2', alias: '새 계좌', owner: '김철수', accountNumber: '11112222', products: [], createdAt: '2026-01-01T00:00:00.000Z' })
    renderDialog()
    fill({ 별칭: '새 계좌', 소유자: '김철수', 계좌번호: '11112222', 'Access Key': 'AK', 'Secret Key': 'SK' })
    await waitFor(() => expect(sessionStorage.getItem('yogurt:account-draft')).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(sessionStorage.getItem('yogurt:account-draft')).toBeNull())
  })
})
