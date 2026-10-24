import { QueryClient, dehydrate } from '@tanstack/react-query'
import { beforeEach, expect, it, vi } from 'vitest'
import { get, set, del } from 'idb-keyval'
import { queryClient } from '../../../src/ui/state/query-client'
import { PERSIST_OPTIONS, queryPersister } from '../../../src/ui/state/query-persister'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }))
beforeEach(() => vi.clearAllMocks())

it('성공한 accounts 쿼리만 영속화하고 세션·mutation은 제외한다', () => {
  const client = new QueryClient()
  client.setQueryData(['accounts'], [{ id: '1', alias: 'Main', accountNumber: '1234' }])
  client.setQueryData(['session'], true)
  client.setQueryData(['other'], 'private')
  client.getQueryCache().build(client, { queryKey: ['accounts', 'pending'] })
  client.getQueryCache().build(client, { queryKey: ['accounts', 'error'] }, {
    ...client.getQueryState(['accounts'])!, status: 'error', error: new Error('failed'),
  })
  client.getMutationCache().build(client, { mutationKey: ['login'] }, {
    status: 'pending', isPaused: true, variables: { password: 'private' },
    context: undefined, data: undefined, error: null, failureCount: 0,
    failureReason: null, submittedAt: 0,
  })
  const state = dehydrate(client, PERSIST_OPTIONS.dehydrateOptions)
  expect(state.queries.map(query => query.queryKey)).toEqual([['accounts']])
  expect(state.mutations).toEqual([])
  expect(PERSIST_OPTIONS.maxAge).toBe(24 * 60 * 60 * 1000)
  expect(queryClient.getDefaultOptions().queries?.gcTime).toBeGreaterThanOrEqual(PERSIST_OPTIONS.maxAge)
  expect(PERSIST_OPTIONS.buster).toBe(import.meta.env.VITE_BUILD_ID ?? 'v1')
  client.clear()
})

it('IndexedDB의 yogurt:query-cache 키로 저장·복원·삭제한다', async () => {
  const cache = { timestamp: 1, buster: 'v1', clientState: { queries: [], mutations: [] } }
  await queryPersister.persistClient(cache)
  expect(set).toHaveBeenCalledWith('yogurt:query-cache', JSON.stringify(cache))
  vi.mocked(get).mockResolvedValueOnce(JSON.stringify(cache))
  expect(await queryPersister.restoreClient()).toEqual(cache)
  expect(get).toHaveBeenCalledWith('yogurt:query-cache')
  await queryPersister.removeClient()
  expect(del).toHaveBeenCalledWith('yogurt:query-cache')
})
