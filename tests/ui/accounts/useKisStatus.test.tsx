import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useKisStatus, type KisSource } from '../../../src/ui/accounts/useKisStatus'

function setup() {
  const listeners = new Map<string, (event: { data: string }) => void>()
  const source: KisSource = {
    addEventListener: (type, listener) => { listeners.set(type, listener) },
    close: vi.fn(),
  }
  const createSource = vi.fn((_url: string) => source)
  const view = renderHook(() => useKisStatus({ createSource: (url) => createSource(url) }))
  const emit = (type: string, data: string) => act(() => listeners.get(type)?.({ data }))
  return { ...view, source, createSource, emit }
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('opens one SSE source and keeps it across inline factory rerenders', () => {
  const { createSource, rerender, emit } = setup()
  emit('status', '{"accountId":"a","status":"connected"}')
  rerender()
  expect(createSource).toHaveBeenCalledExactlyOnceWith('/api/kis/status')
})
it('accumulates account statuses and replaces only the updated account', () => {
  const { result, emit } = setup()
  emit('status', '{"accountId":"a","status":"connected","expiresAt":9}')
  emit('status', '{"accountId":"b","status":"error"}')
  expect(result.current.get('a')).toEqual({ status: 'connected', expiresAt: 9 })
  emit('status', '{"accountId":"a","status":"error"}')
  expect(result.current.get('a')).toEqual({ status: 'error' })
  expect(result.current.get('b')).toEqual({ status: 'error' })
  expect(result.current.size).toBe(2)
})
it('ignores ping, invalid JSON and invalid status payloads', () => {
  const { result, emit } = setup()
  emit('ping', 'ping')
  emit('status', 'broken')
  emit('status', '{"accountId":"a","status":"unknown"}')
  expect(result.current.size).toBe(0)
})
it('closes on unmount and ignores late events', () => {
  const { source, result, unmount, emit } = setup()
  unmount()
  emit('status', '{"accountId":"a","status":"connected"}')
  expect(source.close).toHaveBeenCalledTimes(1)
  expect(result.current.size).toBe(0)
})
it('uses native EventSource and lets it handle reconnection', () => {
  const source = { addEventListener: vi.fn(), close: vi.fn() }
  const EventSource = vi.fn(function () { return source })
  vi.stubGlobal('EventSource', EventSource)
  const { rerender, unmount } = renderHook(() => useKisStatus())
  rerender()
  expect(EventSource).toHaveBeenCalledExactlyOnceWith('/api/kis/status')
  unmount()
  expect(source.close).toHaveBeenCalledTimes(1)
})
it('tolerates environments without EventSource', () => {
  vi.stubGlobal('EventSource', undefined)
  expect(renderHook(() => useKisStatus()).result.current.size).toBe(0)
})
