import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HTTPError } from 'ky'
import { api } from '../../../src/app/http/http'

describe('HTTP API', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('uses /api prefix and keeps ky HTTP errors enabled', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('missing', { status: 404 }))
    await expect(api.get('/missing')).rejects.toBeInstanceOf(HTTPError)
    const request = vi.mocked(fetch).mock.calls[0]?.[0] as Request
    expect(new URL(request.url).pathname).toBe('/api/missing')
  })
})
