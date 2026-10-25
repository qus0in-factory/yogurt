import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { AddAccountDialog } from '../../../src/ui/accounts/AddAccountDialog'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const createAccount = vi.mocked(client.createAccount)

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

  it('상품코드는 숫자 2자리로 제한하고 기본값·예시를 적용한다', () => {
    renderDialog()
    const input = screen.getByLabelText('상품코드')
    expect(input).toHaveValue('01')
    expect(input).toHaveAttribute('maxLength', '2')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]{2}')
    expect(input).toHaveAttribute('placeholder', '01')
  })

  it('상품코드 입력에서 숫자 외 문자를 제거한다', () => {
    renderDialog()
    const input = screen.getByLabelText('상품코드')
    fireEvent.change(input, { target: { value: 'a1b2' } })
    expect(input).toHaveValue('12')
  })

  it('상품코드가 2자리가 아니면 저장하지 않고 오류를 표시한다', async () => {
    renderDialog()
    const form = screen.getByRole('button', { name: '저장' }).closest('form')!
    fireEvent.change(screen.getByLabelText('소유자'), { target: { value: '김철수' } })
    fireEvent.change(screen.getByLabelText('별칭'), { target: { value: '주계좌' } })
    fireEvent.change(screen.getByLabelText('계좌번호'), { target: { value: '12345678' } })
    fireEvent.change(screen.getByLabelText('상품코드'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'AK' } })
    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'SK' } })
    fireEvent.submit(form)
    await waitFor(() => expect(createAccount).not.toHaveBeenCalled())
    expect(await screen.findByText('상품코드는 숫자 2자리로 입력하세요')).toBeInTheDocument()
  })
})
