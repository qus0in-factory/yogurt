import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { Toaster } from 'sonner'
import './styles/globals.css'
import { App } from './App'
import { queryClient } from './state/query-client'
import { PERSIST_OPTIONS, queryPersister } from './state/query-persister'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: queryPersister, ...PERSIST_OPTIONS }}>
      <App />
      <Toaster />
    </PersistQueryClientProvider>
  </StrictMode>,
)
