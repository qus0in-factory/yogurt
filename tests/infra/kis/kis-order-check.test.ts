import { describe, expect, it, vi } from 'vitest'
import {
  BUY_CHECK_PATH, BUY_CHECK_TR_ID, checkBuyable, checkSellable, mapKisFailure,
} from '../../../src/infra/kis/kis-order-check.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function client(handler: (url: string) => Response) {
  return { accountNumber: '12345678', request: vi.fn(async (path: string, options: { query?: Record<string, string> }) => handler(`${path}?${new URLSearchParams(options.query ?? {}).toString()}`)) }
}

describe('주문 전 확인 조회', () => {
  it('매수가능조회가 상수 경로·TR_ID·파라미터로 호출되고 수량·금액을 매핑한다', async () => {
    const account = client(() => ok({ rt_cd: '0', output: { ord_psbl_qty: '10', ord_psbl_amt: '100000' } }))
    const result = await checkBuyable(account, '01', '005930', 10000)
    expect(account.request).toHaveBeenCalledTimes(1)
    const [path, options] = vi.mocked(account.request).mock.calls[0] as [string, { trId: string; query: Record<string, string> }]
    expect(path).toBe(BUY_CHECK_PATH)
    expect(options.trId).toBe(BUY_CHECK_TR_ID)
    expect(options.query).toMatchObject({ CANO: '12345678', ACNT_PRDT_CD: '01', PDNO: '005930', ORD_DVSN: '15' })
    expect(result).toEqual({ availableQty: 10, availableWon: 100000 })
  })

  it('매도가능수량은 잔고조회에서 해당 종목을 찾아 매핑한다', async () => {
    const account = client(() => ok({ rt_cd: '0', output1: [{ pdno: '005930', ord_psbl_qty: '5' }] }))
    await expect(checkSellable(account, '01', '005930')).resolves.toEqual({ availableQty: 5 })
    expect(account.request).toHaveBeenCalledTimes(1)
  })

  it('없는 종목의 매도가능수량은 0이다', async () => {
    const account = client(() => ok({ rt_cd: '0', output1: [] }))
    await expect(checkSellable(account, '01', '005930')).resolves.toEqual({ availableQty: 0 })
  })

  it('실패 코드를 변환한다', () => {
    expect(mapKisFailure('APBK0000', '잔고가 부족합니다')).toBe('INSUFFICIENT_BALANCE')
    expect(mapKisFailure('APBK0000', '주문가능수량을 초과했습니다')).toBe('EXCEEDS_AVAILABLE')
    expect(mapKisFailure('APBK0000', '장마감 시간입니다')).toBe('MARKET_CLOSED')
    expect(mapKisFailure('', '')).toBe('UNKNOWN')
  })
})
