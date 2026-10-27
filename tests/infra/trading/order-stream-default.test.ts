import { Hono } from 'hono'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kstDayString } from '../../../src/infra/trading/order-contracts.ts'
import { orderRoutes } from '../../../src/infra/trading/order-routes.ts'
import { claimOrder, markSending, markSucceeded } from '../../../src/infra/trading/order-idempotency.ts'
import { createFakeKv } from '../fakes/kv.ts'
import { fakeClaimDb } from './fake-claim-db.ts'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))

function fakeDb(credsRow: Record<string, unknown>, products: Array<Record<string, unknown>>) {
  const claims = fakeClaimDb()
  return {
    prepare(sql: string) {
      if (sql.includes('order_claims')) return claims.db.prepare(sql)
      return {
        bind: (...args: unknown[]) => ({
          run: async () => ({ success: true }),
          first: async () => {
            if (sql.includes('FROM accounts')) return credsRow
            return products[0] ?? null
          },
          all: async () => ({ results: [] }),
        }),
      }
    },
  } as unknown as D1Database
}

async function readEvents(res: Response): Promise<Array<{ event: string; data: string }>> {
  const text = await res.text()
  return text.split('\n\n').filter(Boolean).map((block) => ({
    event: (block.match(/^event: (.*)$/m)?.[1] ?? '').trim(),
    data: (block.match(/^data: (.*)$/m)?.[1] ?? '').trim(),
  }))
}

describe('기본 라우트 스트림 연결', () => {
  it('주입 없이 생성한 라우트로 스트림이 열리고 fill이 온다', async () => {
    const accessKey = await encryptText('AK', key)
    const secretKey = await encryptText('SK', key)
    const app = new Hono<{ Bindings: Env }>().route('/api', orderRoutes)
    const db = fakeDb({ access_key_enc: accessKey, secret_key_enc: secretKey, account_number: '1234567801', product_code: '01' }, [{ account_id: 'a1' }])
    const env = { ENVIRONMENT: 'test', DB: db, ACCOUNT_ENCRYPTION_KEY: key, CACHE: createFakeKv() } as unknown as Env
    await claimOrder(db, 'a1:01:r9')
    await markSending(db, 'a1:01:r9')
    await markSucceeded(db, 'a1:01:r9', 'O-9', 't', 'a1', '01')
    server.use(
      http.post('*/oauth2/tokenP', () => HttpResponse.json({ access_token: 'tok', expires_in: 3600 })),
      http.get('*/inquire-daily-ccld', () => HttpResponse.json({ rt_cd: '0', output1: [{ odno: 'O-9', ord_qty: '10', tot_ccld_qty: '10', rmn_qty: '0', cncl_yn: 'N' }] })),
    )
    const res = await app.request('/api/accounts/a1/products/01/orders/stream?orderIds=O-9', { method: 'GET' }, env)
    expect(res.status).toBe(200)
    const events = await readEvents(res)
    expect(events.map((e) => e.event)).toEqual(['fill', 'done'])
    expect(JSON.parse(events[0].data)).toMatchObject({ orderId: 'O-9', status: 'filled' })
  })

  it('KST 날짜는 UTC 15:00을 경계로 바뀐다', () => {
    expect(kstDayString(Date.parse('2026-10-26T14:59:59Z'))).toBe('20261026')
    expect(kstDayString(Date.parse('2026-10-26T15:00:00Z'))).toBe('20261027')
  })
})
