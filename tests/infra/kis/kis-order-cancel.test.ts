// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { cancelOpenOrder } from '../../../src/infra/kis/kis-order-cancel.ts'
import type { KisAccountClient } from '../../../src/infra/kis/kis-stock-balance.ts'

const account = {
  accountNumber: '1234567801', hashkey: vi.fn(async () => 'h'),
  request: vi.fn(async () => new Response(JSON.stringify({ rt_cd: '0', output: { ODNO: 'C-1' } }), { status: 200 })),
} as unknown as KisAccountClient

describe('kis cancel order', () => {
  it('TTTC0803U 취소 본문을 만들고 재시도하지 않는다', async () => {
    const result = await cancelOpenOrder(account, '01', { orderId: 'O-1', orgNo: '001', ordDvsn: '00' })
    expect(result).toEqual({ ok: true, cancelOrderId: 'C-1' })
    expect(account.request).toHaveBeenCalledWith('/uapi/domestic-stock/v1/trading/order-rvsecncl', expect.objectContaining({
      method: 'POST', trId: 'TTTC0803U', retry: false, priority: 'order',
      body: expect.objectContaining({
        ORGN_ODNO: 'O-1', KRX_FWDG_ORD_ORGNO: '001', ORD_DVSN: '00',
        RVSE_CNCL_DVSN_CD: '02', QTY_ALL_ORD_YN: 'Y', ORD_QTY: '0', ORD_UNPR: '0',
      }),
    }))
  })

  it('KIS 메시지를 그대로 실패 결과로 돌려준다', async () => {
    vi.mocked(account.request).mockResolvedValueOnce(new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'APBK', msg1: '취소 불가' }), { status: 200 }))
    await expect(cancelOpenOrder(account, '01', { orderId: 'O-1', orgNo: '001', ordDvsn: '00' }))
      .resolves.toEqual({ ok: false, code: 'APBK', message: '취소 불가' })
  })
})
