import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as client from '../../../src/app/accounts/client'
import { toast } from 'sonner'
import { AccountCard } from '../../../src/ui/accounts/AccountCard'

vi.mock('../../../src/app/accounts/client', () => ({ requestKisToken: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const requestKisToken = vi.mocked(client.requestKisToken)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', createdAt: '2026-01-01T00:00:00.000Z' }

const renderCard = () => {
  const onSelect = vi.fn()
  const onEdit = vi.fn()
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><AccountCard account={account} onSelect={onSelect} onEdit={onEdit} /></QueryClientProvider>)
  return { onSelect, onEdit }
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('AccountCard KIS', () => {
  it('KIS 연결 확인 버튼을 아이콘과 함께 표시한다', () => {
    renderCard()
    const button = screen.getByRole('button', { name: 'KIS 연결 확인' })
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('발급 성공 toast를 표시하고 카드 선택으로 전파하지 않는다', async () => {
    requestKisToken.mockResolvedValueOnce({ issued: true, expiresAt: Date.UTC(2026, 0, 1) })
    const { onSelect, onEdit } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'KIS 연결 확인' }))
    await waitFor(() => expect(requestKisToken).toHaveBeenCalledWith('a1'))
    await waitFor(() => expect(toast).toHaveBeenCalledWith('KIS 토큰을 발급했습니다'))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('이미 발급된 토큰은 서울 시간 HH:mm 만료를 표시한다', async () => {
    requestKisToken.mockResolvedValueOnce({ issued: false, expiresAt: Date.UTC(2026, 0, 1, 3, 5) })
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'KIS 연결 확인' }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith('이미 발급된 토큰이 있습니다 (만료 12:05)'))
  })

  it('실패하면 오류 toast를 표시한다', async () => {
    requestKisToken.mockRejectedValueOnce(new Error('502'))
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'KIS 연결 확인' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('KIS 연결에 실패했습니다'))
  })

  it('진행 중에는 버튼을 비활성화한다', async () => {
    requestKisToken.mockReturnValueOnce(new Promise<never>(() => {}))
    renderCard()
    const button = screen.getByRole('button', { name: 'KIS 연결 확인' })
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
  })
})
