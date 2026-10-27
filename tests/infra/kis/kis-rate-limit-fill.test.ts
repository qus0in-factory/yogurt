import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOrderFill } from '../../../src/infra/kis/kis-order-status.ts'
import { RATE_LIMITED_FILL, classifyFill } from '../../../src/domain/trading/order-fill.ts'
import { createKisClient } from '../../../src/infra/kis/kis-client.ts'
import { createKisQueue } from '../../../src/infra/kis/kis-request-queue.ts'
import { createFakeKv } from '../fakes/kv.ts'

const rate = () => new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'EGW00201', msg1: '초당 거래건수를 초과하였습니다.' }), { status: 200 })
const fillRow = () => new Response(JSON.stringify({ rt_cd: '0', output1: [{ odno: 'O-7', ord_qty: '10', tot_ccld_qty: '10', rmn_qty: '0', cncl_yn: 'N' }] }), { status: 200 })
const stockFail = () => new Response(JSON.stringify({ rt_cd: '1', msg_cd: 'APBK0000', msg1: '잔고가 부족합니다' }), { status: 200 })

let logs: string[] = []
beforeEach(() => {
  logs = []
  vi.spyOn(console, 'info').mockImplementation((line) => { logs.push(String(line)) })
})
afterEach(() => vi.restoreAllMocks())

// 큐 없이 주입 fetch로 직통 응답을 흉내 낸다(크림 완성 전 배선도 같은 결과를 낸다).
function plainMock(pages: Response[]) {
  return {
    accountNumber: '1234567801',
    hashkey: vi.fn(async () => 'h'),
    request: vi.fn(async (_path: string, _options: { query?: Record<string, string> }) => pages.shift() ?? new Response('', { status: 200 })),
  }
}

// 공용 KIS 호출 큐가 연결된 프로덕션 배선과 같은 클라이언트(spark 구현)를 쓴다.
async function queueClient(pages: Response[]) {
  const cache = createFakeKv()
  await cache.put('kis-token:a', JSON.stringify({ accessToken: 'old', expiresAt: 9999 }))
  const fetchFn = vi.fn(async () => pages.shift() ?? new Response('', { status: 200 }))
  const repository = { findCredentials: async () => ({ accountNumber: '1', productCode: '01', accessKey: 'k', secretKey: 's' }) }
  const client = createKisClient({ cache, repository: repository as never, key: 'k', fetchFn: fetchFn as typeof fetch, now: () => 1000, queue: createKisQueue({ minIntervalMs: 0 }), sleep: async (ms: number) => { sleeps.push(ms) } })
  return { account: (await client.forAccount('a'))!, fetchFn }
}
let sleeps: number[] = []
beforeEach(() => { sleeps = [] })

describe('체결 조회의 초당 제한(EGW00201)', () => {
  it('공용 큐 클라이언트로 조회하면 큐가 지수 백오프(200ms·400ms)로 최대 3회 시도한다', async () => {
    const { account, fetchFn } = await queueClient([rate(), rate(), fillRow()])
    const numbers = await fetchOrderFill(account, '01', 'O-7', '20261027')
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(sleeps).toEqual([200, 400])
    expect(numbers).toEqual({ orderedQty: 10, filledQty: 10, remainingQty: 0, cancelled: false })
  })

  it('큐 소진까지 모두 제한이면 unknown 이 아니라 rate_limited다', async () => {
    const { account, fetchFn } = await queueClient([rate(), rate(), rate()])
    const numbers = await fetchOrderFill(account, '01', 'O-7', '20261027')
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(numbers).toBe(RATE_LIMITED_FILL)
    expect(classifyFill(numbers)).toBe('rate_limited')
    const last = JSON.parse(logs[logs.length - 1]) as Record<string, string>
    expect(last).toEqual({ kind: 'ccld-diag', reason: 'rate-limited' })
    expect(logs[logs.length - 1]).not.toMatch(/token|appkey|secret|1234567|005930/)
  })

  it('큐 없이 제한 응답이 오면 즉시 rate_limited로 분류한다(연결 배선은 같은 결과여야 한다)', async () => {
    const mock = plainMock([rate()])
    const numbers = await fetchOrderFill(mock as never, '01', 'O-7', '20261027')
    expect(mock.request).toHaveBeenCalledTimes(1)
    expect(numbers).toBe(RATE_LIMITED_FILL)
    expect(logs.some((line) => line.includes('"reason":"rate-limited"'))).toBe(true)
  })

  it('제한이 아닌 오류는 재시도 없이 unknown을 유지한다', async () => {
    const { account, fetchFn } = await queueClient([stockFail()])
    const numbers = await fetchOrderFill(account, '01', 'O-7', '20261027')
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(numbers).toBeNull()
    expect(classifyFill(numbers)).toBe('unknown')
    expect(logs.some((line) => line.includes('"reason":"rate-limited"'))).toBe(false)
  })
})
