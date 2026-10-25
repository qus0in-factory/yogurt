// @vitest-environment node
import { Hono } from 'hono'
import { beforeEach, expect, it, vi } from 'vitest'
import { kisAssetsHandler } from '../../../src/infra/kis/kis-assets-handler'
import { kisClientFromEnv } from '../../../src/infra/kis/kis-context'
import type { KisAccountClient } from '../../../src/infra/kis/kis-stock-balance'
vi.mock('../../../src/infra/kis/kis-context', () => ({ kisClientFromEnv: vi.fn() }))
const summary = { tot_asst_amt: '100', nass_tot_amt: '90', evlu_amt_smtl: '80',
  pchs_amt_smtl: '70', evlu_pfls_amt_smtl: '10', loan_amt_smtl: '10',
  dncl_amt: '20', tot_dncl_amt: '30', cma_evlu_amt: '40', frcr_evlu_tota: '50' }
const request = vi.fn<KisAccountClient['request']>()
const account = { accountNumber: '12345678', productCode: '29', request, ensureToken: vi.fn() }
const forAccount = vi.fn(async (_id: string) => account as typeof account | null)
const fetchFn = vi.fn<typeof fetch>()
const get = (code = '29') => new Hono<{ Bindings: Env }>()
  .get('/api/accounts/:id/products/:code/assets', c => kisAssetsHandler(c, fetchFn))
  .request(`/api/accounts/a1/products/${code}/assets`, {}, {} as Env)
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(kisClientFromEnv).mockReturnValue({ forAccount })
  forAccount.mockResolvedValue(account)
  request.mockResolvedValue(Response.json({ rt_cd: '0', output1: [], output2: summary, token: 'SECRET' }))
})
it('잘못된 상품은 의존성 확인 전에 400이다', async () => {
  expect((await get('99')).status).toBe(400)
  expect(kisClientFromEnv).not.toHaveBeenCalled()
})
it('의존성이 없으면 503이다', async () => {
  vi.mocked(kisClientFromEnv).mockReturnValue(null)
  expect((await get()).status).toBe(503)
})
it('계좌가 없으면 404이고 KIS를 호출하지 않는다', async () => {
  forAccount.mockResolvedValue(null)
  expect((await get()).status).toBe(404)
  expect(request).not.toHaveBeenCalled()
})
it('성공하면 주입 fetch를 전달하고 정규화 결과만 반환한다', async () => {
  const response = await get()
  expect(response.status).toBe(200)
  expect(kisClientFromEnv).toHaveBeenCalledWith(expect.anything(), fetchFn)
  expect(forAccount).toHaveBeenCalledWith('a1')
  const body = await response.json() as { summary: { deposit: number } }
  expect(body.summary.deposit).toBe(20)
  expect(JSON.stringify(body)).not.toContain('SECRET')
  expect(fetchFn).not.toHaveBeenCalled()
})
it('KIS 실패 시 502와 코드만 반환하고 원문 메시지는 감춘다', async () => {
  request.mockResolvedValue(Response.json({ rt_cd: '1', msg_cd: 'ERR', msg1: 'SECRET' }))
  const response = await get()
  expect(response.status).toBe(502)
  expect(await response.json()).toEqual({ error: 'kis request failed', code: 'ERR' })
})
it('네트워크·파싱 실패는 코드 없는 502이다', async () => {
  request.mockRejectedValue(new Error('SECRET'))
  const response = await get()
  expect(response.status).toBe(502)
  expect(await response.json()).toEqual({ error: 'kis request failed' })
})
