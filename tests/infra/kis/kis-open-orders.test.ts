// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { fetchOpenOrders } from '../../../src/infra/kis/kis-open-orders.ts'
import type { KisAccountClient } from '../../../src/infra/kis/kis-stock-balance.ts'

const account = {
  accountNumber: '1234567801',
  request: vi.fn(async () => new Response(JSON.stringify({
    rt_cd: '0',
    output1: [{
      odno: 'O-1', ord_gno_brno: '001', pdno: '005930', prdt_name: '삼성전자',
      sll_buy_dvsn_cd: '02', ord_qty: '10', tot_ccld_qty: '3', ord_unpr: '70000', ord_tmd: '101010', ord_dvsn_cd: '00',
    }],
  }), { status: 200 })),
} as unknown as KisAccountClient

describe('kis open orders', () => {
  it('TTTC8036R로 미체결 목록을 조회하고 OpenOrder로 매핑한다', async () => {
    const result = await fetchOpenOrders(account, '01')
    expect(account.request).toHaveBeenCalledWith('/uapi/domestic-stock/v1/trading/inquire-psbl-rvsecncl', expect.objectContaining({
      method: 'GET', trId: 'TTTC8036R', query: expect.objectContaining({ CANO: '12345678', ACNT_PRDT_CD: '01' }),
    }))
    expect(result).toEqual([{
      orderId: 'O-1', orgNo: '001', code: '005930', name: '삼성전자', side: 'buy',
      cancellable: true, orderQty: 10, filledQty: 3, remainingQty: 7, price: 70000, orderedAt: '101010',
    }])
  })
})

it('필수 원주문 값 누락은 취소 불가로 표시한다', async () => {
  const request = vi.fn(async () => new Response(JSON.stringify({ rt_cd: '0', output: [{ odno: 'X', ord_qty: '10' }] })))
  const result = await fetchOpenOrders({ accountNumber: '1234567801', request }, '01')
  expect(result[0]).toMatchObject({ orderId: 'X', cancellable: false })
})

it('연속 키를 따라 최대 3페이지를 조회한다', async () => {
  const request = vi.fn(async () => new Response(JSON.stringify({ rt_cd: '0', output: [], ctx_area_fk100: 'F', ctx_area_nk100: 'N' })))
  await fetchOpenOrders({ accountNumber: '1234567801', request }, '01', async () => {})
  expect(request).toHaveBeenCalledTimes(3)
  expect(request.mock.calls[1]).toEqual(expect.arrayContaining([expect.objectContaining({ query: expect.objectContaining({ CTX_AREA_FK100: 'F', CTX_AREA_NK100: 'N' }) })]))
})
