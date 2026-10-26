import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { AccountCard } from '../../../src/ui/accounts/AccountCard'
import * as kisToken from '../../../src/ui/accounts/useKisToken'
import { spacing, typeScale } from '../../../src/ui/styles/type-scale'

vi.mock('../../../src/ui/accounts/useKisToken', () => ({ useKisToken: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))

const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: ['29'], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }

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
  it('카드 여백과 계좌 텍스트에 공통 토큰을 사용한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate: vi.fn() } as never)
    renderCard()
    const card = screen.getByRole('group', { name: '주계좌' })
    expect(card).toHaveClass(...spacing.card.split(' '))
    expect(screen.getByText('주계좌')).toHaveClass(...typeScale.title.split(' '))
    expect(screen.getByText('김철수')).toHaveClass(...typeScale.caption.split(' '))
    expect(screen.getByText('12345678')).toHaveClass(...typeScale.number.split(' '))
  })

  it('KIS 상태 아이콘 버튼을 표시한다', () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate: vi.fn() } as never)
    renderCard()
    expect(screen.getByRole('button', { name: '연결 확인 중' })).toBeInTheDocument()
  })

  it('발급 성공 toast를 표시하고 카드 선택으로 전파하지 않는다', async () => {
    const mutate = vi.fn((_id, options) => options?.onSuccess?.({ issued: true, expiresAt: Date.UTC(2026, 0, 1) }))
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate } as never)
    const { onSelect, onEdit } = renderCard()
    fireEvent.click(screen.getByRole('button', { name: '연결 확인 중' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledWith('a1', expect.any(Object)))
    await waitFor(() => expect(toast).toHaveBeenCalledWith('KIS 토큰을 발급했습니다'))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('이미 발급된 토큰은 서울 시간 HH:mm 만료를 표시한다', async () => {
    const mutate = vi.fn((_id, options) => options?.onSuccess?.({ issued: false, expiresAt: Date.UTC(2026, 0, 1, 3, 5) }))
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate } as never)
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: '연결 확인 중' }))
    await waitFor(() => expect(toast).toHaveBeenCalledWith('이미 발급된 토큰이 있습니다 (만료 12:05)'))
  })

  it('실패하면 오류 toast를 표시한다', async () => {
    const mutate = vi.fn((_id, options) => options?.onError?.())
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: false, mutate } as never)
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: '연결 확인 중' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('KIS 연결에 실패했습니다'))
  })

  it('진행 중에는 버튼을 비활성화한다', async () => {
    vi.mocked(kisToken.useKisToken).mockReturnValue({ isPending: true, mutate: vi.fn() } as never)
    renderCard()
    expect(screen.getByRole('button', { name: '연결 확인 중' })).toBeDisabled()
  })
})
