// @vitest-environment node
import { Hono } from 'hono'
import type { Context } from 'hono'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { encryptText } from '../../../src/infra/accounts/account-crypto.ts'
import { kisBalanceHandler } from '../../../src/infra/kis/kis-balance-handler.ts'
import { createFakeKv } from '../fakes/kv.ts'

const envKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)))
const holding = { pdno: '005930', prdt_name: '삼성전자', hldg_qty: '10', pchs_avg_pric: '70,000', pchs_amt: '700,000', prpr: '80,000', evlu_amt: '800,000', evlu_pfls_amt: '100,000', evlu_pfls_rt: '14.28' }
const summaryRow = { dnca_tot_amt: '1,900,000', scts_evlu_amt: '800,000', tot_evlu_amt: '2,700,000', nass_amt: '2,700,000', pchs_amt_smtl_amt: '700,000', evlu_amt_smtl_amt: '800,000', evlu_pfls_smtl_amt: '100,000', asst_icdc_amt: '100,000', asst_icdc_erng_rt: '3.84' }
const successBody = { rt_cd: '0', msg_cd: 'OP0007109e-2', msg1: '조회 되었습니다', output1: [holding], output2: [summaryRow] }
let credRow: Record<string, string> = {}
let kisBody: unknown = successBody

beforeAll(async () => {
  credRow = {
    access_key_enc: await encryptText('PROTECT-AK', envKey),
    secret_key_enc: await encryptText('PROTECT-SK', envKey),
    account_number: '12345678', product_code: '29',
  }
})

const credsDb = (row: unknown) =>
  ({ prepare: () => ({ bind: (..._args: unknown[]) => ({ first: async () => row, run: async () => ({ success: true }) }) }) }) as unknown as D1Database

const fetchFn = vi.fn(async (input: RequestInfo | URL) =>
  new Response(JSON.stringify(String(input).includes('/oauth2/') ? { access_token: 'PROTECT-TOKEN', expires_in: 3600 } : kisBody), { status: 200 }))

const appFor = (env: unknown) => {
  const app = new Hono<{ Bindings: Env }>()
  app.get('/api/accounts/:id/products/:code/balance', (c: Context<{ Bindings: Env }>) => kisBalanceHandler(c, fetchFn as unknown as typeof fetch))
  return app
}

const request = (path: string, env: unknown) => appFor(env).request(path, { method: 'GET' }, env as Env)

beforeEach(() => {
  vi.clearAllMocks()
  kisBody = successBody
})

describe('kis 잔고 라우트', () => {
  it('허용되지 않은 상품코드는 저장소 확인 전에 400이다', async () => {
    expect((await request('/api/accounts/a1/products/99/balance', {})).status).toBe(400)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('저장소가 설정되지 않으면 503이다', async () => {
    const env = { ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: createFakeKv() }
    expect((await request('/api/accounts/a1/products/29/balance', env)).status).toBe(503)
  })

  it('계좌가 없으면 404이다', async () => {
    const env = { DB: credsDb(null), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: createFakeKv() }
    expect((await request('/api/accounts/a1/products/29/balance', env)).status).toBe(404)
  })

  it('KIS 오류(rt_cd≠0)는 502에 msg_cd를 담는다', async () => {
    const env = { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: createFakeKv() }
    kisBody = { rt_cd: '1', msg_cd: 'MF99961011', msg1: '계좌 비밀번호 불일치', output1: [], output2: [] }
    const res = await request('/api/accounts/a1/products/29/balance', env)
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: 'kis request failed', code: 'MF99961011' })
  })

  it('성공하면 200·정규화 JSON으로 키·토큰 원문을 노출하지 않는다', async () => {
    const env = { DB: credsDb(credRow), ACCOUNT_ENCRYPTION_KEY: envKey, CACHE: createFakeKv() }
    const res = await request('/api/accounts/a1/products/29/balance', env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { summary: Record<string, number>; holdings: Array<Record<string, unknown>> }
    expect(body.summary.cash).toBe(1900000)
    expect(body.holdings[0].code).toBe('005930')
    const text = JSON.stringify(body)
    expect(text).not.toContain('PROTECT-')
  })
})
