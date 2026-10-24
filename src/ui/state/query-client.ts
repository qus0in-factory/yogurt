import { QueryClient } from '@tanstack/react-query'
import { PERSIST_OPTIONS } from './query-persister'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, gcTime: PERSIST_OPTIONS.maxAge } },
})
