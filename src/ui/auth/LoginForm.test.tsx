import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authClient from '../../app/auth/client'
import { LoginForm } from './LoginForm'

vi.mock('../../app/auth/client', () => ({
  checkSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

const login = vi.mocked(authClient.login)

function renderForm(onLoginSuccess = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LoginForm', () => {
  it('비밀번호 레이블과 연결된 입력창을 표시한다', () => {
    renderForm()
    const input = screen.getByLabelText('비밀번호')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('비밀번호가 틀리면 role=alert 오류 문구를 표시한다', async () => {
    login.mockResolvedValueOnce(false)
    renderForm()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong-pass' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('비밀번호가 올바르지 않습니다.')
  })

  it('제출 중에는 입력창과 제출 버튼이 비활성화된다', async () => {
    login.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve(true), 0)))
    renderForm()
    const input = screen.getByLabelText('비밀번호')
    const button = screen.getByRole('button', { name: '로그인' })

    fireEvent.change(input, { target: { value: 'my-pass' } })
    fireEvent.click(button)

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()

    await waitFor(() => expect(button).not.toBeDisabled())
  })
  it('로그인 성공 시 onLoginSuccess 콜백을 호출한다', async () => {
    const handleSuccess = vi.fn()
    login.mockResolvedValueOnce(true)
    renderForm(handleSuccess)
    const input = screen.getByLabelText('비밀번호')
    fireEvent.change(input, { target: { value: 'valid-pass' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1)
    })
  })
})
