import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as authClient from '../../app/auth/client'
import { LoginForm } from './LoginForm'

afterEach(cleanup)

describe('LoginForm', () => {
  it('비밀번호 레이블과 연결된 입력창을 표시한다', () => {
    render(<LoginForm onLoginSuccess={vi.fn()} />)
    const input = screen.getByLabelText('비밀번호')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('비밀번호가 틀리면 role=alert 오류 문구를 표시한다', async () => {
    vi.spyOn(authClient, 'login').mockResolvedValueOnce(false)
    render(<LoginForm onLoginSuccess={vi.fn()} />)
    const input = screen.getByLabelText('비밀번호')
    fireEvent.change(input, { target: { value: 'wrong-pass' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('비밀번호가 올바르지 않습니다.')
  })

  it('제출 중에는 입력창과 제출 버튼이 비활성화된다', async () => {
    let resolveLogin: (value: boolean) => void = () => {}
    vi.spyOn(authClient, 'login').mockImplementationOnce(
      () => new Promise((resolve) => { resolveLogin = resolve })
    )
    render(<LoginForm onLoginSuccess={vi.fn()} />)
    const input = screen.getByLabelText('비밀번호')
    const button = screen.getByRole('button', { name: '로그인' })

    fireEvent.change(input, { target: { value: 'my-pass' } })
    fireEvent.click(button)

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()

    resolveLogin(true)
    await waitFor(() => expect(button).not.toBeDisabled())
  })

  it('로그인 성공 시 onLoginSuccess 콜백을 호출한다', async () => {
    const handleSuccess = vi.fn()
    vi.spyOn(authClient, 'login').mockResolvedValueOnce(true)
    render(<LoginForm onLoginSuccess={handleSuccess} />)
    const input = screen.getByLabelText('비밀번호')
    fireEvent.change(input, { target: { value: 'valid-pass' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledTimes(1)
    })
  })
})
