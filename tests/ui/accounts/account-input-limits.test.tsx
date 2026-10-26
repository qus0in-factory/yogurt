import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { AddAccountDialog } from '../../../src/ui/accounts/AddAccountDialog'
import { EditAccountDialog } from '../../../src/ui/accounts/EditAccountDialog'

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
  it('소유자는 8자, 별칭은 16자로 제한한다', () => {
    renderDialog()
    expect(screen.getByLabelText('소유자')).toHaveAttribute('maxLength', '8')
    expect(screen.getByLabelText('별칭')).toHaveAttribute('maxLength', '16')
  })

  it('수정 대화상자에서도 소유자는 8자, 별칭은 16자로 제한한다', () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }
    render(<QueryClientProvider client={queryClient}><EditAccountDialog account={account} onClose={vi.fn()} /></QueryClientProvider>)
    expect(screen.getByLabelText('소유자')).toHaveAttribute('maxLength', '8')
    expect(screen.getByLabelText('별칭')).toHaveAttribute('maxLength', '16')
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
