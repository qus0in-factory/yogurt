import { describe, expect, it, vi } from 'vitest'
import { fetchOrderFill } from '../../../src/infra/kis/kis-order-status.ts'
import { NOT_FOUND_FILL } from '../../../src/domain/trading/order-fill.ts'

const okBody = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const row = (odnos: string) => ({ odno: odnos, ord_qty: '10', tot_ccld_qty: '10', rmn_qty: '0', cncl_yn: 'N' })
const page = (odno: string, ctx?: { fk: string; nk: string }) =>
  new Response(JSON.stringify({ rt_cd: '0', output1: [row(odno)], ctx_area_fk100: ctx?.fk, ctx_area_nk100: ctx?.nk }), { status: 200 })

function client(pages: Response[]) {
  return {
    accountNumber: '1234567801',
    hashkey: vi.fn(async () => 'h'),
    request: vi.fn(async (_path: string, _options: { query?: Record<string, string> }) => pages.shift() ?? new Response('', { status: 200 })),
  }
}
const noSleep = vi.fn(async () => {})

describe('체결 조회 매칭과 페이지 추적', () => {
  it('앞 0 차이로 주문 번호를 찾는다', async () => {
    const numbers = await fetchOrderFill(client([page('00712'), page('O-2')]), '01', '712', '20261027', noSleep)
    expect(numbers).toEqual({ orderedQty: 10, filledQty: 10, remainingQty: 0, cancelled: false })
  })

  it('CTX 연속 키가 있으면 1초 간격으로 최대 3 페이지까지 직렬 추적한다', async () => {
    const account = client([page('O-1', { fk: 'FK1', nk: 'NK1' }), page('O-2', { fk: 'FK2', nk: 'NK2' }), page('O-3', { fk: 'FK3', nk: 'NK3' }), page('O-4')])
    const numbers = await fetchOrderFill(account, '01', 'O-3', '20261027', noSleep)
    expect(numbers).toEqual({ orderedQty: 10, filledQty: 10, remainingQty: 0, cancelled: false })
    expect(account.request).toHaveBeenCalledTimes(3)
    expect(noSleep).toHaveBeenCalledTimes(2)
    const queries = vi.mocked(account.request).mock.calls.map((call) => (call[1] as { query: Record<string, string> }).query)
    expect(queries[1]).toMatchObject({ CTX_AREA_FK100: 'FK1', CTX_AREA_NK100: 'NK1' })
    expect(queries[2]).toMatchObject({ CTX_AREA_FK100: 'FK2', CTX_AREA_NK100: 'NK2' })
  })

  it('연속 키가 없으면 1 페이지에서 끝내고 번호를 찾아 돌려준다', async () => {
    const account = client([page('O-1')])
    await fetchOrderFill(account, '01', 'O-1', '20261027', noSleep)
    expect(account.request).toHaveBeenCalledTimes(1)
    expect(noSleep).not.toHaveBeenCalled()
  })

  it('조회 실패는 null(unknown), 미발견은 NOT_FOUND_FILL(not_found)를 돌려준다', async () => {
    await expect(fetchOrderFill(client([new Response('', { status: 500 })]), '01', 'O-1', '20261027', noSleep)).resolves.toBeNull()
    await expect(fetchOrderFill(client([page('O-2')]), '01', 'O-9', '20261027', noSleep)).resolves.toBe(NOT_FOUND_FILL)
  })
})
