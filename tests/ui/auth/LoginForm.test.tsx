import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authClient from '../../../src/app/auth/client'
import { toast } from 'sonner'
import { LoginForm } from '../../../src/ui/auth/LoginForm'
import { typeScale } from '../../../src/ui/styles/type-scale'

vi.mock('../../../src/app/auth/client', () => ({ checkSession: vi.fn(), login: vi.fn(), logout: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const login = vi.mocked(authClient.login)

const renderForm = (onLoginSuccess = vi.fn()) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><LoginForm onLoginSuccess={onLoginSuccess} /></QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  it('비밀번호 레이블과 입력창을 표시한다', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: '로그인' })).toHaveClass(...typeScale.pageTitle.split(' '))
    const input = screen.getByLabelText('비밀번호')
    expect(input).toHaveAttribute('type', 'password')
  })
  it('빈 값이면 클라이언트 오류를 표시하고 요청하지 않는다', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('비밀번호를 입력하세요')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
  it('401이면 폼 오류와 toast.error를 표시한다', async () => {
    login.mockResolvedValueOnce(false)
    renderForm()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByText('비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('비밀번호가 올바르지 않습니다.'))
  })
  it('서버 오류면 잠시 후 다시 시도하세요 toast를 표시한다', async () => {
    login.mockRejectedValueOnce(new Error('network'))
    renderForm()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('잠시 후 다시 시도하세요'))
  })
  it('제출 중에는 입력창과 버튼이 비활성화된다', async () => {
    login.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve(true), 0)))
    renderForm()
    const input = screen.getByLabelText('비밀번호')
    const button = screen.getByRole('button', { name: '로그인' })
    fireEvent.change(input, { target: { value: 'pw' } })
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    expect(input).toBeDisabled()
    await waitFor(() => expect(button).not.toBeDisabled())
  })
  it('로그인 성공 시 onLoginSuccess를 호출한다', async () => {
    const success = vi.fn()
    login.mockResolvedValueOnce(true)
    renderForm(success)
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw' } })
    fireEvent.submit(screen.getByLabelText('비밀번호').closest('form')!)
    await waitFor(() => expect(success).toHaveBeenCalledTimes(1))
  })
})
