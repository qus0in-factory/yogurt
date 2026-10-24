import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AddAccountDialog } from '../../../src/ui/accounts/AddAccountDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const renderDialog = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}><AddAccountDialog open onClose={vi.fn()} /></QueryClientProvider>)
}

beforeEach(() => sessionStorage.clear())
afterEach(cleanup)

describe('계좌 입력 제한', () => {
  it('소유자와 별칭은 8자로 제한한다', () => {
    renderDialog()
    expect(screen.getByLabelText('소유자')).toHaveAttribute('maxLength', '8')
    expect(screen.getByLabelText('별칭')).toHaveAttribute('maxLength', '8')
  })

  it('계좌번호에 숫자 8자리 브라우저 제한과 예시를 적용한다', () => {
    renderDialog()
    const input = screen.getByLabelText('계좌번호')
    expect(input).toHaveAttribute('maxLength', '8')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]{8}')
    expect(input).toHaveAttribute('placeholder', '12345678')
  })

  it('계좌번호 입력에서 숫자 외 문자를 제거한다', () => {
    renderDialog()
    const input = screen.getByLabelText('계좌번호')
    fireEvent.change(input, { target: { value: '12a3-4567' } })
    expect(input).toHaveValue('1234567')
  })
})
