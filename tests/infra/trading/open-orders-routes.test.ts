// @vitest-environment node
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import { targetExists } from '../../../src/infra/portfolio/assignment-repository.ts'
import { createOrderRoutes } from '../../../src/infra/trading/order-routes.ts'
import type { KisAccountClient } from '../../../src/infra/kis/kis-stock-balance.ts'

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({ targetExists: vi.fn() }))

const row = {
  odno: 'O-1', ord_gno_brno: '001', pdno: '005930', prdt_name: '삼성전자', sll_buy_dvsn_cd: '02',
  ord_qty: '10', tot_ccld_qty: '3', ord_unpr: '70000', ord_tmd: '101010', ord_dvsn_cd: '00',
}
const setup = (rows: unknown[] = [row]) => {
  vi.mocked(targetExists).mockResolvedValue(true)
  const request = vi.fn(async (_path: string, options: { method: string; body?: unknown }) => {
    if (options.method === 'POST') return new Response(JSON.stringify({ rt_cd: '0', output: { ODNO: 'C-1' } }))
    return new Response(JSON.stringify({ rt_cd: '0', output1: rows }))
  })
  const account = { accountNumber: '1234567801', request, hashkey: async () => 'h' } as unknown as KisAccountClient
  const app = new Hono<{ Bindings: Env }>().route('/api', createOrderRoutes({ fetchFn: (async () => { throw new Error('no calls') }) as typeof fetch, resolveAccount: async () => account }))
  const call = (path: string, method: string, body?: unknown) => app.request(path, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined,
  }, { DB: {} } as unknown as Env)
  return { call, request }
}
const base = '/api/accounts/a1/products/01/orders'

describe('open orders routes', () => {
  it('미체결 목록을 {orders}로 반환하고 IRP는 거부한다', async () => {
    const { call } = setup()
    const res = await call(`${base}/open`, 'GET')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ orders: [{ orderId: 'O-1', remainingQty: 7, side: 'buy' }] })
    expect((await call('/api/accounts/a1/products/29/orders/open', 'GET')).status).toBe(400)
  })

  it('목록에 없는 주문은 취소하지 않고, 있는 주문은 원주문 ORD_DVSN으로 취소한다', async () => {
    const missing = setup([])
    expect((await missing.call(`${base}/O-2/cancel`, 'POST', { orgNo: '001' })).status).toBe(404)
    expect(missing.request).toHaveBeenCalledTimes(1)

    const found = setup()
    const res = await found.call(`${base}/O-1/cancel`, 'POST', { orgNo: '001' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, cancelOrderId: 'C-1' })
    expect(found.request).toHaveBeenLastCalledWith('/uapi/domestic-stock/v1/trading/order-rvsecncl', expect.objectContaining({
      method: 'POST', trId: 'TTTC0803U', retry: false,
      body: expect.objectContaining({ ORGN_ODNO: 'O-1', ORD_DVSN: '00', KRX_FWDG_ORD_ORGNO: '001', QTY_ALL_ORD_YN: 'Y' }),
    }))
  })
})

it('기관번호 불일치와 필수 원주문 누락은 POST 없이 거부한다', async () => {
  const x = setup()
  expect((await x.call(`${base}/O-1/cancel`, 'POST', { orgNo: 'UNTRUSTED' })).status).toBe(400)
  expect(x.request).toHaveBeenCalledTimes(1)
  const y = setup([{ ...row, ord_dvsn_cd: undefined }])
  expect((await y.call(`${base}/O-1/cancel`, 'POST', { orgNo: '001' })).status).toBe(400)
  expect(y.request).toHaveBeenCalledTimes(1)
})

it('당일 체결 전체 행을 주문번호 없이 조회하고 종목·KST 시각을 노출한다', async () => {
  const x = setup([{ ...row, rmn_qty: '0', ord_dt: '20261027', ord_tmd: '090001' }])
  const response = await x.call(`${base}/daily`, 'GET')
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject([{ orderNo: 'O-1', code: '005930', orderedAt: '2026-10-27T09:00:01+09:00', orderedQty: 10 }])
})
