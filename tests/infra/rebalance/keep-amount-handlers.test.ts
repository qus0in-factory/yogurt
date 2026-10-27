// @vitest-environment node
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { keepAmountRoutes } from '../../../src/infra/rebalance/routes.ts'

function fakeDb(options: { target?: boolean; fail?: boolean } = {}) {
  let keep: number | undefined
  const db = {
    prepare(sql: string) {
      return {
        bind: (...args: unknown[]) => ({
          first: async () => {
            if (options.fail) throw new Error('db failed')
            if (sql.includes('account_products')) return options.target === false ? null : { account_id: 'a1' }
            return keep === undefined ? null : { keep_amount: keep }
          },
          run: async () => {
            if (options.fail) throw new Error('db failed')
            keep = Number(args[2])
            return { success: true, meta: { changes: 1 } }
          },
        }),
      }
    },
  } as unknown as D1Database
  return { db, value: () => keep }
}

const app = new Hono<{ Bindings: Env }>().route('/api', keepAmountRoutes)
const request = (path: string, method: string, body?: unknown, db?: D1Database) => app.request(path, {
  method,
  headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
}, { DB: db } as unknown as Env)

const PATH = '/api/accounts/a1/products/01/rebalance-keep-amount'

describe('rebalance keep amount API', () => {
  it('행이 없으면 GET 0, PUT 후에는 저장값을 반환한다', async () => {
    const { db, value } = fakeDb()
    const empty = await request(PATH, 'GET', undefined, db)
    expect(empty.status).toBe(200)
    expect(await empty.json()).toEqual({ keepAmount: 0 })
    const put = await request(PATH, 'PUT', { keepAmount: 1234 }, db)
    expect(put.status).toBe(200)
    expect(await put.json()).toEqual({ keepAmount: 1234 })
    expect(value()).toBe(1234)
    expect(await (await request(PATH, 'GET', undefined, db)).json()).toEqual({ keepAmount: 1234 })
  })

  it('잘못된 상품코드·본문은 400 INVALID_KEEP_AMOUNT다', async () => {
    const { db } = fakeDb()
    for (const path of ['/api/accounts/a1/products/99/rebalance-keep-amount']) {
      const res = await request(path, 'PUT', { keepAmount: 1 }, db)
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ code: 'INVALID_KEEP_AMOUNT' })
    }
    for (const body of [{ keepAmount: -1 }, { keepAmount: 1.5 }, { keepAmount: '1' }, {}]) {
      const res = await request(PATH, 'PUT', body, db)
      expect(res.status).toBe(400)
      expect(await res.json()).toMatchObject({ code: 'INVALID_KEEP_AMOUNT' })
    }
  })

  it('없는 대상은 404, DB 없음·실패는 503이다', async () => {
    expect((await request(PATH, 'GET', undefined, fakeDb({ target: false }).db)).status).toBe(404)
    expect((await request(PATH, 'PUT', { keepAmount: 1 }, fakeDb({ target: false }).db)).status).toBe(404)
    expect((await request(PATH, 'GET')).status).toBe(503)
    expect((await request(PATH, 'PUT', { keepAmount: 1 })).status).toBe(503)
    expect((await request(PATH, 'GET', undefined, fakeDb({ fail: true }).db)).status).toBe(503)
    expect((await request(PATH, 'PUT', { keepAmount: 1 }, fakeDb({ fail: true }).db)).status).toBe(503)
  })
})
