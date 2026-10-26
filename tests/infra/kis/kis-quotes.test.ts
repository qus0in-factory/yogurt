import { describe, expect, it, vi } from 'vitest'
import {
  ASK_PATH, ASK_TR_ID, BID1_FIELD, ASK1_FIELD, expectedPrice, fetchBestQuotes,
} from '../../../src/infra/kis/kis-quotes.ts'

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

function client(handler: (url: string) => Response) {
  return {
    accountNumber: '1234567801',
    hashkey: vi.fn(async () => 'h'),
    request: vi.fn(async (path: string, options: { query?: Record<string, string> }) => handler(`${path}?${new URLSearchParams(options.query ?? {}).toString()}`)),
  }
}

describe('호가 조회와 예상 가격', () => {
  it('호가 경로·TR_ID로 조회하고 ask1·bid1을 매핑한다', async () => {
    const account = client(() => ok({ rt_cd: '0', output1: { [ASK1_FIELD]: '10100', [BID1_FIELD]: '10050' } }))
    const result = await fetchBestQuotes(account, '01', '005930')
    expect(account.request).toHaveBeenCalledTimes(1)
    const [path, options] = vi.mocked(account.request).mock.calls[0] as [string, { trId: string; query: Record<string, string> }]
    expect(path).toBe(ASK_PATH)
    expect(options.trId).toBe(ASK_TR_ID)
    expect(options.query).toMatchObject({ PDNO: '005930' })
    expect(result).toEqual({ ask1: 10100, bid1: 10050 })
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
})
