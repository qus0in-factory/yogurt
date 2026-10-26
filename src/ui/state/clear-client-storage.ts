import { del } from 'idb-keyval'
import { MASK_MODE_STORAGE_KEY } from './mask-store'
import { queryClient } from './query-client'
import { useUiStore } from './ui-store'
import { useRecentVisitsStore } from './recent-visits'

export async function clearClientStorage(clearQuery = true): Promise<void> {
  if (clearQuery) queryClient.clear()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false })
  useRecentVisitsStore.getState().clear()
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('yogurt:') && key !== MASK_MODE_STORAGE_KEY) storage.removeItem(key)
    }
  }
  await del('yogurt:query-cache')
}
