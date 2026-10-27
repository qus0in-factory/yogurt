import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDailyCcld, fetchOrderFill } from '../../../src/infra/kis/kis-order-status.ts'
import { KisApiError } from '../../../src/infra/kis/kis-stock-balance.ts'

const rows = (...r: Record<string, unknown>[]) => ({ rt_cd: '0', output1: r })
const row = (odno: string, filled = '10') => ({ odno, ord_qty: '10', tot_ccld_qty: filled, rmn_qty: '0', cncl_yn: 'N' })
const okBody = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function client(handler: (url: string) => Response) {
  return {
    accountNumber: '1234567801',
    hashkey: vi.fn(async () => 'h'),
    request: vi.fn(async (path: string, options: { query?: Record<string, string> }) => handler(`${path}?${new URLSearchParams(options.query ?? {}).toString()}`)),
  }
}

let infoLines: string[] = []
beforeEach(() => {
  infoLines = []
  vi.spyOn(console, 'info').mockImplementation((line) => { infoLines.push(String(line)) })
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-26T15:00:00Z') })
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

describe('체결 조회 파라미터', () => {
  it('KST 당일 창으로 전체 조회 파라미터를 보낸다', async () => {
    const account = client(() => okBody(rows(row('O-7'))))
    await fetchDailyCcld(account, '01', '', '20261001', '20261001')
    const [, options] = vi.mocked(account.request).mock.calls[0] as [string, { query: Record<string, string> }]
    expect(options.query).toMatchObject({
      CANO: '12345678', ACNT_PRDT_CD: '01', INQR_STRT_DT: '20261027', INQR_END_DT: '20261027',
      SLL_BUY_DVSN_CD: '00', CCLD_DVSN: '00', INQR_DVSN: '00', INQR_DVSN_3: '00', INQR_DVSN_1: '',
      PDNO: '', ORD_GNO_BRNO: '', ODNO: '', EXCG_ID_DVSN_CD: 'ALL', CTX_AREA_FK100: '', CTX_AREA_NK100: '',
    })
  })
})

describe('체결 조회 안전 실패와 진단', () => {
  it.each([['빈', () => new Response('', { status: 200 })], ['비 JSON', () => new Response('gw', { status: 200 })], ['500', () => okBody({ rt_cd: '1' }, 500)]])(
    '%s 본문이면 KisApiError', async (_n, handler) => {
      await expect(fetchDailyCcld(client(handler), '01', '')).rejects.toBeInstanceOf(KisApiError)
    },
  )

  it('실패 진단은 상태와 형태만 남긴다', async () => {
    await expect(fetchDailyCcld(client(() => okBody({ rt_cd: '1', msg_cd: 'EGW00123', output1: [] })), '01', '')).rejects.toBeDefined()
    const log = JSON.parse(infoLines[0])
    expect(log).toEqual({ kind: 'ccld-diag', status: 200, contentLength: expect.any(Number), rt_cd: '1', msg_cd: 'EGW00123', msg1: '', outputKeys: ['rt_cd', 'msg_cd', 'output1'], output1Keys: [] })
    expect(infoLines[0]).not.toMatch(/token|appkey|secret|1234567/)
  })

  it('미발견 진단은 행 수·첫 행 키·odno 후보만 남긴다', async () => {
    await fetchDailyCcld(client(() => okBody(rows(row('00712'), row('O-2')))), '01', '', '20261027', '20261027', '799')
    const log = JSON.parse(infoLines[0])
    expect(log).toEqual({ kind: 'ccld-diag', reason: 'order-not-found', rowCount: 2, firstRowKeys: ['odno', 'ord_qty', 'tot_ccld_qty', 'rmn_qty', 'cncl_yn'], orderNoKeys: ['odno'] })
    expect(infoLines[0]).not.toContain('00712')
  })

  it('0행이면 rowCount 0 진단을 남긴다', async () => {
    await fetchDailyCcld(client(() => okBody(rows())), '01', '', '20261027', '20261027', 'O-9')
    expect(JSON.parse(infoLines[0])).toMatchObject({ kind: 'ccld-diag', reason: 'order-not-found', rowCount: 0, firstRowKeys: [] })
  })
})
