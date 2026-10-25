// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import { previousMonthEnd } from '../../src/domain/accounts/snapshot-month.ts'
import { createFakeKv } from './fakes/kv'
import app from '../../src/infra/worker.ts'

let secret = ''
let token = ''
const sessions = createFakeKv()

function db(products: Record<string, string[]>) {
  const row = (id: string) => ({ id, alias: id, owner: '홍길동', account_number: '12345678', created_at: '2026-01-01' })
  return {
    prepare(sql: string) {
      if (sql.includes('FROM accounts')) return { all: async () => ({ results: Object.keys(products).map(row) }) }
      return { bind: (id: string) => ({ all: async () => ({ results: (products[id] ?? []).map((product_code) => ({ product_code, start_date: null, min_target_amount_won: null, max_target_amount_won: null })) }) }) }
    },
  } as unknown as D1Database
}

function countingKv() {
  const base = createFakeKv()
  const get = vi.fn((key: string) => base.get(key))
  return { kv: { ...base, get } as unknown as KVNamespace, get }
}

const env = (cache?: KVNamespace, database = db({ acct: ['01'], isa: ['01'], irp: [] })) =>
  ({ ENVIRONMENT: 'test', SESSION_SECRET: secret, SESSIONS: sessions, DB: database, CACHE: cache, ASSETS: { fetch: async () => new Response('asset') } }) as unknown as Env
const call = (accountId: string, binding: Env, auth = true) => app.fetch(new Request(`https://example.com/api/accounts/${accountId}/isa-last-close`, {
  headers: auth ? { Cookie: `${SESSION_COOKIE}=${token}` } : {},
}), binding)

beforeAll(async () => {
  secret = await generateSessionSecret()
  token = await createSessionToken(secret)
  await saveSession(sessions, token)
})

describe('ISA last close route', () => {
  it('인증이 없으면 401이다', async () => {
    expect((await call('acct', env(createFakeKv()), false)).status).toBe(401)
  })

  it('ISA 계좌는 직전 월 마지막 날 기록을 200으로 돌려준다', async () => {
    const cache = createFakeKv()
    const date = previousMonthEnd(new Date())
    await cache.put(`isa-snapshot:acct:${date}`, JSON.stringify({ totalAssetsWon: 1200, recordedAt: '' }))
    const res = await call('acct', env(cache))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ date, totalAssetsWon: 1200 })
  })

  it('비ISA 계좌는 KV 기록이 있어도 읽지 않고 404다', async () => {
    const { kv, get } = countingKv()
    const date = previousMonthEnd(new Date())
    await kv.put(`isa-snapshot:irp:${date}`, JSON.stringify({ totalAssetsWon: 999, recordedAt: '' }))
    const res = await call('irp', env(kv))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not found' })
    expect(get).not.toHaveBeenCalled()
  })

  it('기록이 없으면 404다', async () => {
    const date = previousMonthEnd(new Date())
    const cache = createFakeKv()
    await cache.put(`isa-snapshot:isa:${date}`, JSON.stringify({ totalAssetsWon: 1, recordedAt: '' }))
    expect((await call('isa', env(createFakeKv()))).status).toBe(404)
  })
})
