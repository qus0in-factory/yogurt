import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { reorderAccounts } from '../../../src/app/accounts/client'
import { useReorderAccounts } from '../../../src/ui/accounts/useAccounts'

vi.mock('../../../src/app/accounts/client', async () => ({ ...(await vi.importActual('../../../src/app/accounts/client')), reorderAccounts: vi.fn() }))
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }))
const rows = ['a', 'b'].map((id) => ({ id, alias: id, owner: id, accountNumber: id, products: [], createdAt: '' }))
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  client.setQueryData(['accounts'], rows)
  const hook = renderHook(() => useReorderAccounts(), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> })
  return { client, hook }
}

it('optimistically reorders and restores the old order when saving fails', async () => {
  const { client, hook } = setup()
  let reject!: (error: Error) => void
  vi.mocked(reorderAccounts).mockReturnValueOnce(new Promise((_, fail) => { reject = fail }))
  act(() => hook.result.current.mutate(['b', 'a']))
  await waitFor(() => expect(client.getQueryData(['accounts'])).toEqual([rows[1], rows[0]]))
  reject(new Error('failed'))
  await waitFor(() => expect(hook.result.current.isError).toBe(true))
  expect(client.getQueryData(['accounts'])).toEqual(rows)
})
