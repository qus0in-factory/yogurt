import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkBuyable } from '../../../src/infra/kis/kis-order-check.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function client(handler: () => Response) {
  return { accountNumber: '12345678', request: vi.fn(handler) }
}

function logs() {
  const lines: string[] = []
  vi.spyOn(console, 'info').mockImplementation((m?: unknown) => { lines.push(String(m)) })
  return lines
}
afterEach(() => { vi.restoreAllMocks() })

describe('미수 없는 매수 기준', () => {
  it('nrcvb_buy_qty·amt가 있으면 그 값을 쓴다', async () => {
    const account = client(() => ok({ rt_cd: '0', output: { nrcvb_buy_qty: '2', nrcvb_buy_amt: '4326571', ord_psbl_qty: '0', ord_psbl_amt: '104672' } }))
    await expect(checkBuyable(account as never, '01', '005930', 1513260)).resolves.toEqual({ availableQty: 2, availableWon: 4326571 })
  })
  it('없으면 기존 ord_psbl 필드로 대체한다', async () => {
    const account = client(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '3', ord_psbl_amt: '30000' } }))
    await expect(checkBuyable(account as never, '01', '005930', 10000)).resolves.toEqual({ availableQty: 3, availableWon: 30000 })
  })
  it('예상 금액 1,513,260원·가능 금액 4,326,571원에서 수량이 0이 아니다', async () => {
    const account = client(() => ok({ rt_cd: '0', output: { nrcvb_buy_qty: '2', nrcvb_buy_amt: '4326571', ord_psbl_qty: '0', ord_psbl_amt: '0' } }))
    const result = await checkBuyable(account as never, '01', '005930', 1513260)
    expect(result.availableQty).toBeGreaterThan(0)
    expect(result.availableWon).toBe(4326571)
  })
  it('성공하면 buy-cash-diag에 네 필드 값을 남긴다', async () => {
    const lines = logs()
    const account = client(() => ok({ rt_cd: '0', output: { nrcvb_buy_qty: '2', nrcvb_buy_amt: '4326571', ord_psbl_qty: '0', ord_psbl_amt: '104672' } }))
    await checkBuyable(account as never, '01', '005930', 1513260)
    const diag = lines.map((l) => JSON.parse(l) as Record<string, unknown>).find((d) => d.kind === 'buy-cash-diag')
    expect(diag).toMatchObject({ nrcvbBuyQty: 2, nrcvbBuyAmt: 4326571, ordPsblQty: 0, ordPsblAmt: 104672 })
    expect(lines.join(' ')).not.toMatch(/12345678|Bearer/i)
  })
})
