import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { setAccountProduct } from '../../../src/app/accounts/client'
import { ProductToggles } from '../../../src/ui/accounts/ProductToggles'
vi.mock('../../../src/app/accounts/client', () => ({ setAccountProduct: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
const account = { id: 'a', alias: 'a', owner: 'o', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '' }
afterEach(() => { cleanup(); vi.clearAllMocks() })
function show(products: string[] = []) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const parent = vi.fn()
  render(<QueryClientProvider client={client}><div onClick={parent}>
    <ProductToggles account={{ ...account, products }} />
  </div></QueryClientProvider>)
  return { invalidate, parent, button: screen.getByRole('button', { name: 'IRP' }) }
}
it.each([false, true])('toggles enabled=%s, stops propagation and refreshes accounts', async enabled => {
  vi.mocked(setAccountProduct).mockResolvedValue({ ...account, products: enabled ? [] : ['29'] })
  const { button, parent, invalidate } = show(enabled ? ['29'] : [])
  expect(button).toHaveAttribute('aria-pressed', String(enabled))
  expect(button).toHaveClass('gap-2')
  expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByRole('button', { name: '연금저축' })).toBeInTheDocument()
  fireEvent.click(button)
  await waitFor(() => expect(setAccountProduct).toHaveBeenCalledWith('a', '29', !enabled))
  await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['accounts'] }))
  expect(parent).not.toHaveBeenCalled()
})
it('disables during a pending mutation', async () => {
  vi.mocked(setAccountProduct).mockReturnValue(new Promise(() => {}))
  const { button } = show()
  fireEvent.click(button)
  await waitFor(() => expect(button).toBeDisabled())
})
it('reports failure without changing pressed state', async () => {
  vi.mocked(setAccountProduct).mockRejectedValue(new Error('failed'))
  const { button } = show()
  fireEvent.click(button)
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('상품 설정을 변경하지 못했습니다'))
  expect(button).toHaveAttribute('aria-pressed', 'false')
})
it.each([false, true])('상품 활성화 %s와 무관하게 탭과 동일한 아이콘을 순서대로 표시한다', enabled => {
  show(enabled ? ['01', '22', '29'] : [])
  const buttons = screen.getAllByRole('button')
  expect(buttons.map(button => button.textContent)).toEqual(['ISA', '연금저축', 'IRP'])
  const icons = ['trending-up', 'piggy-bank', 'armchair']
  buttons.forEach((button, index) => {
    const icon = button.querySelector('svg')
    expect(button).toHaveAttribute('aria-pressed', String(enabled))
    expect(button).toHaveClass('gap-2')
    expect(icon).toHaveClass('h-4', 'w-4', `lucide-${icons[index]}`)
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(button.firstChild).toBe(icon)
  })
})
