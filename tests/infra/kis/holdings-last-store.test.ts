// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { seoulDateTime } from '../../../src/domain/accounts/snapshot-month.ts'
import { holdingsLastKey, readHoldingsLast, writeHoldingsLast } from '../../../src/infra/kis/holdings-last-store.ts'
import { createFakeKv } from '../fakes/kv.ts'

const KEY = 'holdings-last:a1:29'
const DAY = 86400000
const asOf = (days: number) => seoulDateTime(new Date(Date.now() - days * DAY))
const holding = { code: '005930', name: '삼성전자', quantity: 10, averagePrice: 70000, purchaseAmount: 700000, currentPrice: 80000, evaluationAmount: 800000, profitLoss: 100000, profitLossRate: 14.28 }
const stored = { holdings: [holding], stockEvaluationWon: 800000, asOf: asOf(1) }

describe('holdings-last 저장소', () => {
  it('키는 holdings-last:계좌:상품 형식이다', () => {
    expect(holdingsLastKey('a1', '29')).toBe(KEY)
  })
  it('저장된 값이 없으면 null이다', async () => {
    expect(await readHoldingsLast(createFakeKv(), 'a1', '29', new Date())).toBeNull()
  })
  it('손상된 JSON은 예외 없이 null이다', async () => {
    const kv = createFakeKv()
    await kv.put(KEY, '{"holdings":')
    expect(await readHoldingsLast(kv, 'a1', '29', new Date())).toBeNull()
  })
  it('7일 이내 값은 그대로 돌려준다', async () => {
    const kv = createFakeKv()
    await kv.put(KEY, JSON.stringify(stored))
    expect(await readHoldingsLast(kv, 'a1', '29', new Date())).toEqual(stored)
  })
  it('7일이 지난 값은 사용하지 않는다', async () => {
    const kv = createFakeKv()
    await kv.put(KEY, JSON.stringify({ ...stored, asOf: asOf(8) }))
    expect(await readHoldingsLast(kv, 'a1', '29', new Date())).toBeNull()
  })
  it('캐시 읽기 오류는 값 없음으로 처리한다', async () => {
    const kv = createFakeKv()
    vi.spyOn(kv, 'get').mockRejectedValue(new Error('kv down'))
    expect(await readHoldingsLast(kv, 'a1', '29', new Date())).toBeNull()
  })
  it('빈 보유는 저장하지 않는다', async () => {
    const kv = createFakeKv()
    const put = vi.spyOn(kv, 'put')
    await writeHoldingsLast(kv, 'a1', '29', { holdings: [], stockEvaluationWon: 0, asOf: asOf(0) })
    expect(put).not.toHaveBeenCalled()
  })
  it('값은 604800초 TTL로 저장한다', async () => {
    const kv = createFakeKv()
    const put = vi.spyOn(kv, 'put')
    await writeHoldingsLast(kv, 'a1', '29', stored)
    expect(put.mock.calls.find(([key]) => key === KEY)?.[2]).toEqual({ expirationTtl: 604800 })
  })
  it('저장 실패는 예외를 전파하지 않는다', async () => {
    const kv = createFakeKv()
    vi.spyOn(kv, 'put').mockRejectedValue(new Error('kv down'))
    await expect(writeHoldingsLast(kv, 'a1', '29', stored)).resolves.toBeUndefined()
  })
})
