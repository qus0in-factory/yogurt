import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import * as client from '../../../src/app/accounts/client'
import { toast } from 'sonner'
import { EditAccountDialog } from '../../../src/ui/accounts/EditAccountDialog'
import { useUiStore } from '../../../src/ui/state/ui-store'

vi.mock('../../../src/app/accounts/client', () => ({ listAccounts: vi.fn(), createAccount: vi.fn(), updateAccount: vi.fn(), deleteAccount: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const deleteAccount = vi.mocked(client.deleteAccount)
const account = { id: 'a1', alias: '주계좌', owner: '김철수', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }

function Harness({ onClose }: { onClose: () => void }) {
  const [editing, setEditing] = useState(true)
  return editing ? <EditAccountDialog account={account} onClose={() => { setEditing(false); onClose() }} /> : <p>닫힘</p>
}

const renderEdit = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const onClose = vi.fn()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(<QueryClientProvider client={queryClient}><Harness onClose={onClose} /></QueryClientProvider>)
  return { onClose, invalidate }
}

const openConfirm = () => {
  fireEvent.click(screen.getByRole('button', { name: '계좌 삭제' }))
  return screen.getByRole('dialog', { name: '계좌를 삭제할까요?' })
}

beforeEach(() => {
  vi.clearAllMocks()
  useUiStore.setState({ selectedAccountId: null })
  document.body.style.overflow = ''
})
afterEach(cleanup)

describe('계좌 삭제', () => {
  it('삭제하면 호출·두 모달 닫기·toast·선택 해제를 처리한다', async () => {
    deleteAccount.mockResolvedValueOnce(undefined)
    useUiStore.setState({ selectedAccountId: 'a1' })
    const { onClose, invalidate } = renderEdit()
    const confirm = openConfirm()
    expect(within(confirm).getByText('김철수 · 주계좌 (12345678) 계좌와 저장된 키가 영구 삭제됩니다.')).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith('a1'))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('닫힘')).toBeInTheDocument()
    await waitFor(() => expect(toast).toHaveBeenCalledWith('계좌를 삭제했습니다'))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['accounts'] }))
    await waitFor(() => expect(useUiStore.getState().selectedAccountId).toBeNull())
    await waitFor(() => expect(document.body.style.overflow).toBe(''))
  })

  it('취소하면 삭제하지 않고 수정 모달을 유지한다', () => {
    const { onClose } = renderEdit()
    const confirm = openConfirm()
    fireEvent.click(within(confirm).getByRole('button', { name: '취소' }))
    expect(deleteAccount).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: '계좌 수정' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: '계좌를 삭제할까요?' })).not.toBeInTheDocument()
  })

  it('404면 이미 삭제 안내 후 목록을 갱신하고 닫는다', async () => {
    deleteAccount.mockRejectedValueOnce(Object.assign(new Error('gone'), { response: { status: 404 } }))
    const { onClose, invalidate } = renderEdit()
    fireEvent.click(within(openConfirm()).getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('이미 삭제된 계좌입니다'))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['accounts'] }))
  })
})
