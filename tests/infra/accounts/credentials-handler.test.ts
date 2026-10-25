// @vitest-environment node
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { replaceCredentials } from '../../../src/infra/accounts/credentials-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'

const validKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))
const body = { accessKey: 'AK_plain_123', secretKey: 'SK_plain_456' }

function createFakeDb(changes = 1) {
  const run = vi.fn(async () => ({ meta: { changes } }))
  const bind = vi.fn((..._args: unknown[]) => ({ run }))
  const prepare = vi.fn((_sql: string) => ({ bind }))
  return { db: { prepare } as unknown as D1Database, prepare, bind, run }
}

function call(binding: Partial<Env>, id = 'acc-1', reqBody?: unknown) {
  const app = new Hono<{ Bindings: Env }>()
  app.put('/api/accounts/:id/credentials', replaceCredentials)
  return app.fetch(new Request(`https://example.com/api/accounts/${id}/credentials`, {
    method: 'PUT',
    headers: reqBody !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: reqBody !== undefined ? JSON.stringify(reqBody) : undefined,
  }), binding as Env)
}

describe('replaceCredentials handler', () => {
  it('성공 시 암호화하여 저장하고 204를 반환하며 토큰 캐시를 삭제한다', async () => {
    const { db, bind } = createFakeDb(1)
    const cache = createFakeKv()
    await cache.put('kis-token:acc-1', 'cached_token')
    const res = await call({ DB: db, ACCOUNT_ENCRYPTION_KEY: validKey, CACHE: cache }, 'acc-1', body)
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(await cache.get('kis-token:acc-1')).toBeNull()
    const [accessEnc, secretEnc, id] = bind.mock.calls[0] as [string, string, string]
    expect(id).toBe('acc-1')
    expect(accessEnc).toMatch(/^v1:/)
    expect(secretEnc).toMatch(/^v1:/)
    expect(accessEnc).not.toContain('AK_plain_123')
    expect(secretEnc).not.toContain('SK_plain_456')
  })

  it('CACHE가 없어도 204로 성공한다', async () => {
    const { db } = createFakeDb(1)
    const res = await call({ DB: db, ACCOUNT_ENCRYPTION_KEY: validKey }, 'acc-1', body)
    expect(res.status).toBe(204)
  })

  it('DB 또는 암호화 키가 없거나 잘못되었으면 503이다', async () => {
    const { db } = createFakeDb(1)
    expect((await call({ DB: db }, 'acc-1', body)).status).toBe(503)
    expect((await call({ DB: db, ACCOUNT_ENCRYPTION_KEY: 'bad_key' }, 'acc-1', body)).status).toBe(503)
    expect((await call({ ACCOUNT_ENCRYPTION_KEY: validKey }, 'acc-1', body)).status).toBe(503)
  })

  it('입력이 잘못되었으면 400이다', async () => {
    const { db } = createFakeDb(1)
    const env = { DB: db, ACCOUNT_ENCRYPTION_KEY: validKey }
    expect((await call(env, 'acc-1', { accessKey: '', secretKey: 'sk' })).status).toBe(400)
    expect((await call(env, 'acc-1', {})).status).toBe(400)
  })

  it('계좌가 없으면 404를 반환하고 어떤 오류에도 키를 노출하지 않는다', async () => {
    const { db } = createFakeDb(0)
    const res = await call({ DB: db, ACCOUNT_ENCRYPTION_KEY: validKey }, 'acc-none', body)
    expect(res.status).toBe(404)
    const text = await res.text()
    expect(text).not.toContain('AK_plain_123')
    expect(text).not.toContain('SK_plain_456')
  })
})
