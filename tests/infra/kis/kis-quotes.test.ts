import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ASK_PATH, ASK_TR_ID, BID1_FIELD, ASK1_FIELD, expectedPrice, fetchBestQuotes } from '../../../src/infra/kis/kis-quotes.ts'
import { KisApiError } from '../../../src/infra/kis/kis-stock-balance.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

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
})
afterEach(() => vi.restoreAllMocks())

describe('호가 조회와 예상 가격', () => {
  it('현재가와 같은 시세 형식으로 요청하고 ask1·bid1을 매핑한다(계좌 파라미터 없음)', async () => {
    const account = client(() => ok({ rt_cd: '0', output1: { [ASK1_FIELD]: '10100', [BID1_FIELD]: '10050' } }))
    const result = await fetchBestQuotes(account, '01', '005930')
    expect(account.request).toHaveBeenCalledTimes(1)
    const [path, options] = vi.mocked(account.request).mock.calls[0] as [string, { trId: string; query: Record<string, string> }]
    expect(path).toBe(ASK_PATH)
    expect(options.trId).toBe(ASK_TR_ID)
    expect(options.query).toEqual({ FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: '005930' })
    expect(result).toEqual({ ask1: 10100, bid1: 10050 })
    expect(infoLines).toHaveLength(0)
  })

  it('호가가 없거나 0 이하면 0으로 정규화한다', async () => {
    const account = client(() => ok({ rt_cd: '0', output1: {} }))
    await expect(fetchBestQuotes(account, '01', '005930')).resolves.toEqual({ ask1: 0, bid1: 0 })
  })

  it('매수 예상가는 ask1, 매도 예상가는 bid1이며 없으면 null이다', () => {
    expect(expectedPrice('buy', { ask1: 10100, bid1: 10050 })).toBe(10100)
    expect(expectedPrice('sell', { ask1: 10100, bid1: 10050 })).toBe(10050)
    expect(expectedPrice('buy', { ask1: 0, bid1: 10050 })).toBeNull()
    expect(expectedPrice('sell', { ask1: 10100, bid1: 0 })).toBeNull()
  })

  it.each([['빈 본문', () => new Response('', { status: 200 })], ['비 JSON', () => new Response('gw html', { status: 200 })], ['HTTP 500', () => new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'EGW00123' }), { status: 500 })]])(
    '%s여도 예외로 죽지 않고 KisApiError를 발생시킨다', async (_name, handler) => {
      await expect(fetchBestQuotes(client(handler), '01', '005930')).rejects.toBeInstanceOf(KisApiError)
    },
  )

  it('실패 시 진단 로그는 값·토큰·계좌번호 없이 한 줄 형태만 남긴다', async () => {
    await expect(fetchBestQuotes(client(() => new Response('', { status: 200 })), '01', '005930')).rejects.toBeDefined()
    expect(infoLines).toHaveLength(1)
    expect(JSON.parse(infoLines[0])).toEqual({ kind: 'quote-diag', status: 200, contentLength: 0, rt_cd: '', msg_cd: '', msg1: '', outputKeys: [] })
    expect(infoLines[0]).not.toMatch(/token|appkey|secret|1234567(?:80)?\d/)
  })

  it('output1에 askp1·bidp1이 없으면 outputKeys를 진단 로그에 남기고 0으로 매핑한다', async () => {
    const result = await fetchBestQuotes(client(() => ok({ rt_cd: '0', output1: { odno: 'O-1' } })), '01', '005930')
    expect(result).toEqual({ ask1: 0, bid1: 0 })
    expect(infoLines).toHaveLength(1)
    expect(JSON.parse(infoLines[0]).outputKeys).toEqual(['odno'])
    expect(infoLines[0]).not.toContain('O-1')
  })
})
