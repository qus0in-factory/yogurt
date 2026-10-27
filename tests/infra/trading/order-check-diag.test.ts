import { afterEach, describe, expect, it, vi } from 'vitest'
import { ok, setupRoutes } from './order-routes.test.ts'
import { pinOpenMarket } from './market-time.ts'

const buyBody = { requestId: 'c1', code: '005930', side: 'buy', quantity: 1, orderType: 'ioc', price: 10000 }
const sellBody = { ...buyBody, requestId: 'c2', side: 'sell' }

function logs() {
  const lines: string[] = []
  vi.spyOn(console, 'info').mockImplementation((m?: unknown) => { lines.push(String(m)) })
  return lines
}
afterEach(() => { vi.restoreAllMocks() })

describe('확인 조회 실패 원인 노출', () => {
  pinOpenMarket()
  it('매수 가능 실패는 stage·kisCode·kisMessage를 돌려주고 로그한다', async () => {
    const lines = logs()
    const { call } = setupRoutes(() => ok({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '잔고 부족' }))
    const res = await call('/api/accounts/a1/products/01/orders/check', buyBody)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ code: 'ORDER_CHECK_FAILED', stage: 'buyable', kisCode: 'APBK0000', kisMessage: '잔고 부족' })
    const diag = lines.map((l) => JSON.parse(l) as Record<string, unknown>).find((d) => d.kind === 'check-diag')
    expect(diag).toMatchObject({ stage: 'buyable', status: 200, kisCode: 'APBK0000' })
    expect(Object.keys(diag ?? {}).sort()).toEqual(['kind', 'kisCode', 'kisMessage', 'stage', 'status'])
    expect(lines.join(' ')).not.toMatch(/12345678|Bearer/i)
  })
  it('제한 오류는 kisCode EGW00201로 구분된다', async () => {
    logs()
    const { call } = setupRoutes(() => ok({ rt_cd: '1', msg_cd: 'EGW00201', msg1: '초당 거래건수를 초과하였습니다.' }))
    const res = await call('/api/accounts/a1/products/01/orders/check', buyBody)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ stage: 'buyable', kisCode: 'EGW00201' })
  })
  it('EGW00215 매도 확인 실패는 kisCode EGW00215, stage sellable이다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '1', msg_cd: 'EGW00215', msg1: '원장에서 허용 가능한 초당 거래건수를 초과하였습니다.' }))
    const res = await call('/api/accounts/a1/products/01/orders/check', sellBody)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ stage: 'sellable', kisCode: 'EGW00215' })
  })
  it('매도 확인 실패는 stage sellable이다', async () => {
    const { call } = setupRoutes(() => new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '잔고 조회 실패' }), { status: 500 }))
    const res = await call('/api/accounts/a1/products/01/orders/check', sellBody)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ stage: 'sellable', kisCode: 'APBK0000' })
  })
  it('호가 실패는 stage quote·status null이다', async () => {
    const lines = logs()
    const { call } = setupRoutes((url: string) => url.includes('asking-price')
      ? new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '호가 없음' }), { status: 500 })
      : ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '5' }] }))
    const res = await call('/api/accounts/a1/products/01/orders/check', sellBody)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ stage: 'quote', kisCode: 'APBK0000' })
    const diag = lines.map((l) => JSON.parse(l) as Record<string, unknown>).find((d) => d.kind === 'check-diag')
    expect(diag).toMatchObject({ stage: 'quote', status: null })
  })
  it('price 0은 400 INVALID_PRICE이고 본문에 reason이 있다', async () => {
    const { call } = setupRoutes(() => ok({}))
    const res = await call('/api/accounts/a1/products/01/orders/check', { ...buyBody, price: 0 })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'INVALID_ORDER_CHECK', reason: expect.stringContaining('INVALID_PRICE') })
  })
  it('수량 초과는 availableQty·requestedQty를 함께 돌려준다', async () => {
    const { call } = setupRoutes(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '2', ord_psbl_amt: '20000' } }))
    const res = await call('/api/accounts/a1/products/01/orders/check', { ...buyBody, quantity: 5 })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'ORDER_QUANTITY_EXCEEDED', availableQty: 2, requestedQty: 5 })
  })
})
