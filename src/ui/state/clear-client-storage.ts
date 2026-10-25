import { del } from 'idb-keyval'
import { queryClient } from './query-client'
import { useUiStore } from './ui-store'

export async function clearClientStorage(clearQuery = true): Promise<void> {
  if (clearQuery) queryClient.clear()
  useUiStore.setState({ screen: 'accounts', drawerOpen: false })
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('yogurt:')) storage.removeItem(key)
    }
  }
  await del('yogurt:query-cache')
}
