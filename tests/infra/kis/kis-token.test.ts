// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { getKisToken, issueKisToken } from '../../../src/infra/kis/kis-token.ts'
import { createFakeKv } from '../fakes/kv.ts'

describe('kis token', () => {
  it('issueKisToken은 KIS 응답을 파싱한다', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ access_token: 'token-1', expires_in: 3600 }), { status: 200 }))
    const result = await issueKisToken(fetchFn as unknown as typeof fetch, 'key', 'secret')
    expect(result.accessToken).toBe('token-1')
    expect(result.issued).toBe(true)
  })

  it('캐시가 있으면 재발급하지 않는다', async () => {
    const cache = createFakeKv()
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ access_token: 'token-1', expires_in: 3600 }), { status: 200 }))
    const first = await getKisToken(cache, 'acc-1', { accessKey: 'k', secretKey: 's' }, fetchFn as unknown as typeof fetch, 1000)
    const second = await getKisToken(cache, 'acc-1', { accessKey: 'k', secretKey: 's' }, fetchFn as unknown as typeof fetch, 2000)
    expect(first.issued).toBe(true)
    expect(second.issued).toBe(false)
    expect(second.accessToken).toBe(first.accessToken)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('만료된 캐시는 재발급한다', async () => {
    const cache = createFakeKv()
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ access_token: 'token-1', expires_in: 3600 }), { status: 200 }))
    await getKisToken(cache, 'acc-1', { accessKey: 'k', secretKey: 's' }, fetchFn as unknown as typeof fetch, 1000)
    const fetchFn2 = vi.fn(async () => new Response(JSON.stringify({ access_token: 'token-2', expires_in: 3600 }), { status: 200 }))
    const result = await getKisToken(cache, 'acc-1', { accessKey: 'k', secretKey: 's' }, fetchFn2 as unknown as typeof fetch, 1000 + 3600 * 1000)
    expect(result.issued).toBe(true)
    expect(result.accessToken).toBe('token-2')
  })
})
