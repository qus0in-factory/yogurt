import type { Query } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

export const PERSIST_OPTIONS = {
  maxAge: 24 * 60 * 60 * 1000,
  buster: import.meta.env.VITE_BUILD_ID ?? 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.queryKey[0] === 'accounts' && query.state.status === 'success',
    shouldDehydrateMutation: () => false,
  },
}

export const queryPersister = createAsyncStoragePersister({
  key: 'yogurt:query-cache',
  throttleTime: 0,
  storage: {
    getItem: (key) => get<string>(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
})
