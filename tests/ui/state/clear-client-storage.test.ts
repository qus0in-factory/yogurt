import { afterEach, expect, it, vi } from 'vitest'
import { del } from 'idb-keyval'
import { queryClient } from '../../../src/ui/state/query-client'
import { clearClientStorage } from '../../../src/ui/state/clear-client-storage'
import { useUiStore } from '../../../src/ui/state/ui-store'
import { useRecentVisitsStore, RECENT_VISITS_STORAGE_KEY } from '../../../src/ui/state/recent-visits'
import { LAST_PAGE_STORAGE_KEY } from '../../../src/infra/navigation/last-page-storage'

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

it('clearQuery가 false이면 쿼리는 유지하고 yogurt: 키만 지운다', async () => {
  queryClient.setQueryData(['accounts'], [{ id: '1' }])
  localStorage.setItem('yogurt:ui', 'value')
  localStorage.setItem('other', 'keep')
  await clearClientStorage(false)
  expect(queryClient.getQueryCache().getAll()).toHaveLength(1)
  expect(localStorage.getItem('yogurt:ui')).toBeNull()
  expect(localStorage.getItem('other')).toBe('keep')
})

it.each([true, false])('clear(%s) 호출 시 메모리 screen을 accounts로 초기화하고 drawer를 닫으며 새 키를 지운다', async (clearQuery) => {
  useUiStore.setState({ screen: 'overview', drawerOpen: true })
  localStorage.setItem(LAST_PAGE_STORAGE_KEY, JSON.stringify({ version: 1, screen: 'overview' }))
  localStorage.setItem('other-app:key', 'preserved')

  await clearClientStorage(clearQuery)

  expect(useUiStore.getState().screen).toBe('accounts')
  expect(useUiStore.getState().drawerOpen).toBe(false)
  expect(localStorage.getItem(LAST_PAGE_STORAGE_KEY)).toBeNull()
  expect(localStorage.getItem('other-app:key')).toBe('preserved')
})

it('최근 방문 저장과 메모리 상태를 함께 지운다', async () => {
  localStorage.setItem(RECENT_VISITS_STORAGE_KEY, JSON.stringify([{ screen: 'accounts', label: '계좌' }]))
  useRecentVisitsStore.setState({ visits: [{ screen: 'accounts', label: '계좌' }] })
  await clearClientStorage()
  expect(localStorage.getItem(RECENT_VISITS_STORAGE_KEY)).toBeNull()
  expect(useRecentVisitsStore.getState().visits).toEqual([])
})
