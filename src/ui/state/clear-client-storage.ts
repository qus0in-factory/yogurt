import { del } from 'idb-keyval'
import { queryClient } from './query-client'

export async function clearClientStorage(): Promise<void> {
  queryClient.clear()
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('yogurt:')) storage.removeItem(key)
    }
  }
  await del('yogurt:query-cache')
}
