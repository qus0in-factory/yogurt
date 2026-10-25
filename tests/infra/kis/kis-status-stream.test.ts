// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { kisStatusStream } from '../../../src/infra/kis/kis-status-stream.ts'
import { createFakeKv } from '../fakes/kv.ts'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'

const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))

async function readEvents(response: Response): Promise<string[]> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
  }
  return text.split('\n\n').filter(Boolean)
}

describe('kis status stream', () => {
  it('DB·키·CACHE 없으면 503이다', async () => {
    const c = { req: { url: 'http://localhost/api/kis/status' }, env: { ENVIRONMENT: 'test', ASSETS: { fetch: async () => new Response('asset') } }, json: (body: unknown, status: number) => new Response(JSON.stringify(body), { status }) } as any
    const res = kisStatusStream(c)
    expect(res.status).toBe(503)
  })

  it('계좌별 status 이벤트와 ping을 전송한다', async () => {
    const cache = createFakeKv()
    const accessKeyEnc = await encryptText('AK', key)
    const secretKeyEnc = await encryptText('SK', key)
    const row = { id: 'a1', alias: 'IRP', owner: 'me', account_number: '12345678', product_code: '29', access_key_enc: accessKeyEnc, secret_key_enc: secretKeyEnc, created_at: '2026-01-01T00:00:00.000Z' }
    const db = { prepare: () => ({ all: async () => ({ results: [row] }), bind: (..._args: unknown[]) => ({ first: async () => row, all: async () => ({ results: [row] }), run: async () => ({ success: true }) }) }) } as unknown as D1Database
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 }))
    const { Hono } = await import('hono')
    const app = new Hono()
    app.get('/x', (c) => kisStatusStream(c as any, { sleep: async () => {}, now: () => 1000, interval: 0, maxDuration: 0, fetchFn: fetchFn as unknown as typeof fetch }))
    const env = { ENVIRONMENT: 'test', DB: db, ACCOUNT_ENCRYPTION_KEY: key, CACHE: cache, ASSETS: { fetch: async () => new Response('asset') } }
    const res = await app.fetch(new Request('http://localhost/x'), env as any)
    const events = await readEvents(res)
    expect(events.some((e) => e.includes('event: status'))).toBe(true)
    expect(events.some((e) => e.includes('"status":"connected"'))).toBe(true)
  })
})
