// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { createSessionToken } from '../../src/infra/auth/crypto.ts'
import { saveSession } from '../../src/infra/auth/session-store.ts'
import { SESSION_COOKIE } from '../../src/infra/auth/cookies.ts'
import { generateSessionSecret } from '../../src/infra/secrets/session-key.ts'
import app from '../../src/infra/worker.ts'
import { createFakeKv } from './fakes/kv.ts'

const sessions = createFakeKv()
const row = { id: 'a', alias: 'ISA', owner: '홍길동', account_number: '12345678', created_at: '2026-01-01' }
let secret = ''; let token = ''
function db(enabled = true) {
  let saved = { start_date: null as string | null, min_target_amount_won: null as number | null, max_target_amount_won: null as number | null }
  return { prepare: (sql: string) => ({ bind: (...args: unknown[]) => ({
    run: async () => {
      saved = { start_date: args[0] as string | null, min_target_amount_won: args[1] as number | null, max_target_amount_won: args[2] as number | null }
      return { meta: { changes: enabled ? 1 : 0 } }
    },
    first: async () => row,
    all: async () => ({ results: sql.includes('account_products') && enabled ? [{ product_code: '01', ...saved }] : [row] }),
  }) }) } as unknown as D1Database
}
const call = (body: unknown, DB: D1Database | null = db(), auth = true, code = '01') => app.fetch(new Request(`https://example.com/api/accounts/a/products/${code}/plan`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}) }, body: JSON.stringify(body),
}), { DB: DB ?? undefined, SESSION_SECRET: secret, SESSIONS: sessions } as Env)
const emptyPlan = { startDate: null, minTargetAmountWon: null, maxTargetAmountWon: null }
beforeAll(async () => { secret = await generateSessionSecret(); token = await createSessionToken(secret); await saveSession(sessions, token) })

describe('PUT account product plan', () => {
  it('saves start date and target amounts and returns Account with productPlans', async () => {
    const plan = { startDate: '2024-02-29', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null }
    const response = await call(plan)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ products: ['01'], productPlans: { '01': plan } })
  })
  it('all-null plan deletes the saved plan while keeping the enabled product', async () => {
    expect(await (await call(emptyPlan)).json()).toMatchObject({ products: ['01'], productPlans: {} })
  })
  it.each([
    { startDate: '2024-02-30', minTargetAmountWon: null, maxTargetAmountWon: null },
    { startDate: '2024-03-15', minTargetAmountWon: -1, maxTargetAmountWon: null },
    { startDate: '2024-03-15', minTargetAmountWon: 20_000_000, maxTargetAmountWon: 10_000_000 },
    { startDate: null, minTargetAmountWon: 10_000_000, maxTargetAmountWon: null },
  ])('rejects invalid plan payload with 400', async body => {
    expect((await call(body)).status).toBe(400)
  })
  it('rejects product codes outside the catalog', async () => {
    expect((await call(emptyPlan, db(), true, '99')).status).toBe(400)
  })
  it('returns 404 for a product that is not enabled', async () => {
    const response = await call(emptyPlan, db(false))
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'product not enabled' })
  })
  it('uses authentication and configuration errors', async () => {
    expect((await call(emptyPlan, db(), false)).status).toBe(401)
    expect((await call(emptyPlan, null)).status).toBe(503)
  })
})
