import { afterEach, expect, it, vi } from 'vitest'
import { del } from 'idb-keyval'
import { queryClient } from '../../../src/ui/state/query-client'
import { clearClientStorage } from '../../../src/ui/state/clear-client-storage'

vi.mock('idb-keyval', () => ({ del: vi.fn(), get: vi.fn(), set: vi.fn() }))
afterEach(() => {
  queryClient.clear()
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})

it('쿼리와 IndexedDB 캐시 및 yogurt: 접두사 키만 정리한다', async () => {
  queryClient.setQueryData(['accounts'], [{ id: '1' }])
  for (const storage of [localStorage, sessionStorage]) {
    storage.setItem('yogurt:ui', 'value')
    storage.setItem('yogurt:another', 'value')
    storage.setItem('other', 'keep')
  }
  await clearClientStorage()
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  expect(del).toHaveBeenCalledWith('yogurt:query-cache')
  for (const storage of [localStorage, sessionStorage]) {
    expect(storage.getItem('yogurt:ui')).toBeNull()
    expect(storage.getItem('yogurt:another')).toBeNull()
    expect(storage.getItem('other')).toBe('keep')
  }
})
