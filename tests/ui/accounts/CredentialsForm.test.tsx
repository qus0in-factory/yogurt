import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { replaceCredentials } from '../../../src/app/accounts/credentials-client'
import { CredentialsForm } from '../../../src/ui/accounts/CredentialsForm'

vi.mock('../../../src/app/accounts/credentials-client', async (importOriginal) => ({ ...await importOriginal<typeof import('../../../src/app/accounts/credentials-client')>(), replaceCredentials: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const replace = vi.mocked(replaceCredentials)
beforeEach(() => { vi.clearAllMocks(); replace.mockResolvedValue(undefined) })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
function show() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const onBack = vi.fn()
  const onClose = vi.fn()
  render(<QueryClientProvider client={client}><CredentialsForm accountId="a1" onBack={onBack} onClose={onClose} /></QueryClientProvider>)
  return { invalidate, onBack, onClose }
}
it('빈 값이면 검증 메시지를 표시하고 교체하지 않는다', async () => {
  show()
  fireEvent.click(screen.getByRole('button', { name: '교체' }))
  expect(await screen.findByText('Access Key를 입력하세요')).toBeInTheDocument()
  expect(screen.getByText('Secret Key를 입력하세요')).toBeInTheDocument()
  expect(replace).not.toHaveBeenCalled()
})
it('비밀번호 입력을 새 키로 받고 성공 시 닫기·toast·KIS 쿼리 무효화를 수행한다', async () => {
  const { invalidate, onClose } = show()
  expect(screen.getByLabelText('Access Key')).toHaveValue('')
  expect(screen.getByLabelText('Secret Key')).toHaveAttribute('type', 'password')
  fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
  fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
  fireEvent.click(screen.getByRole('button', { name: '교체' }))
  await waitFor(() => expect(replace).toHaveBeenCalledWith('a1', { accessKey: 'AK', secretKey: 'SK' }))
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  expect(toast).toHaveBeenCalledWith('키를 교체했습니다')
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['kis-status'] })
})
it('실패 상태에 따라 toast를 표시한다', async () => {
  show()
  replace.mockRejectedValueOnce(Object.assign(new Error('nf'), { response: { status: 404 } }))
  fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
  fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
  fireEvent.click(screen.getByRole('button', { name: '교체' }))
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('계좌를 찾을 수 없습니다'))
})

it('키를 세션 초안 저장소에 저장하지 않는다', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem')
  show()
  fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
  fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
  fireEvent.click(screen.getByRole('button', { name: '교체' }))
  expect(setItem).not.toHaveBeenCalled()
})
