import { useEffect, useRef, useState } from 'react'
import { parseKisStatus } from '../../app/kis/kis-status'

export type KisStatusInfo = { status: 'connected' | 'error'; expiresAt?: number }
export type KisStatuses = Map<string, KisStatusInfo>
export type KisSource = {
  addEventListener: (type: string, listener: (event: { data: string }) => void) => void
  close: () => void
}
const openKisSource = (url: string): KisSource | null => (
  typeof EventSource === 'undefined' ? null : new EventSource(url)
)

export function useKisStatus({ createSource = openKisSource }: { createSource?: (url: string) => KisSource | null } = {}): KisStatuses {
  const factory = useRef(createSource)
  const [statuses, setStatuses] = useState<KisStatuses>(() => new Map())
  useEffect(() => {
    let active = true
    const source = factory.current('/api/kis/status')
    source?.addEventListener('status', ({ data }) => {
      const parsed = parseKisStatus(data)
      if (!active || !parsed) return
      const { accountId, status, expiresAt } = parsed
      setStatuses((current) => new Map(current).set(accountId, { status, expiresAt }))
    })
    return () => {
      active = false
      source?.close()
    }
  }, [])
  return statuses
}
