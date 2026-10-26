// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month.ts'
import { cashLastKey, readCashLast, writeCashLast } from '../../../src/infra/kis/cash-last-store.ts'
import { createFakeKv } from '../fakes/kv.ts'

const KEY = 'cash-last:a1:29'
const DAY = 86400000
const asOf = (days: number) => seoulDateTime(new Date(Date.now() - days * DAY))
const cached = { cashWon: 5000, asOf: asOf(1), source: 'kis' as const }

describe('cash-last 저장소', () => {
  it('키는 cash-last:계좌:상품 형식이다', () => {
    expect(cashLastKey('a1', '29')).toBe(KEY)
  })
  it('저장된 값이 없으면 null이다', async () => {
    expect(await readCashLast(createFakeKv(), 'a1', '29', new Date())).toBeNull()
  })
  it('손상된 JSON은 예외 없이 null이다', async () => {
    const kv = createFakeKv()
    await kv.put(KEY, '{"cashWon":')
    expect(await readCashLast(kv, 'a1', '29', new Date())).toBeNull()
  })
  it('7일 이내 값은 그대로 돌려준다', async () => {
    const kv = createFakeKv()
    await kv.put(KEY, JSON.stringify(cached))
    expect(await readCashLast(kv, 'a1', '29', new Date())).toEqual(cached)
  })
  it('7일이 지난 값은 사용하지 않는다', async () => {
    const kv = createFakeKv()
    await kv.put(KEY, JSON.stringify({ ...cached, asOf: asOf(8) }))
    expect(await readCashLast(kv, 'a1', '29', new Date())).toBeNull()
  })
  it('0·음수·비정수 현금은 저장하지 않는다', async () => {
    const kv = createFakeKv()
    const put = vi.spyOn(kv, 'put')
    for (const cashWon of [0, -1000, 1.5, Number.NaN]) await writeCashLast(kv, 'a1', '29', { ...cached, cashWon })
    expect(put).not.toHaveBeenCalled()
  })
  it('값은 604800초 TTL로 저장한다', async () => {
    const kv = createFakeKv()
    const put = vi.spyOn(kv, 'put')
    await writeCashLast(kv, 'a1', '29', cached)
    expect(put.mock.calls.find(([key]) => key === KEY)?.[2]).toEqual({ expirationTtl: 604800 })
  })
  it('읽기 오류는 값 없음, 저장 실패는 조용히 넘어간다', async () => {
    const kv = createFakeKv()
    vi.spyOn(kv, 'get').mockRejectedValue(new Error('kv down'))
    vi.spyOn(kv, 'put').mockRejectedValue(new Error('kv down'))
    expect(await readCashLast(kv, 'a1', '29', new Date())).toBeNull()
    await expect(writeCashLast(kv, 'a1', '29', cached)).resolves.toBeUndefined()
  })
})
