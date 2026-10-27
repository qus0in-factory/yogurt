import { describe, expect, it } from 'vitest'
import { claimOrder, findClaimByOrder, markSending, markSucceeded, markUnknown, releaseClaimed, releaseSettled } from '../../../src/infra/trading/order-idempotency.ts'
import { fakeClaimDb } from './fake-claim-db.ts'

describe('주문 클레임 상태 전이', () => {
  it('claimed → sending → succeeded 후에는 저장 결과를 돌려준다', async () => {
    const { db } = fakeClaimDb()
    expect(await claimOrder(db, 'r1')).toEqual({ outcome: 'claimed' })
    expect(await claimOrder(db, 'r1')).toEqual({ outcome: 'processing' })
    expect(await markSending(db, 'r1')).toBe(true)
    expect(await releaseClaimed(db, 'r1')).toBe(false)
    expect(await markSucceeded(db, 'r1', 'ORD-1', 't', 'a1', '01')).toBe(true)
    expect(await claimOrder(db, 'r1')).toEqual({ outcome: 'done', orderNo: 'ORD-1', acceptedAt: 't' })
  })
  it('sending에서 타임아웃하면 unknown으로 남고 해제되지 않는다', async () => {
    const { db } = fakeClaimDb()
    await claimOrder(db, 'r2')
    await markSending(db, 'r2')
    expect(await markUnknown(db, 'r2')).toBe(true)
    expect(await releaseClaimed(db, 'r2')).toBe(false)
    expect(await claimOrder(db, 'r2')).toEqual({ outcome: 'unknown' })
  })
  it('claimed 상태에서만 해제된다', async () => {
    const { db } = fakeClaimDb()
    await claimOrder(db, 'r3')
    expect(await releaseClaimed(db, 'r3')).toBe(true)
    expect(await claimOrder(db, 'r3')).toEqual({ outcome: 'claimed' })
  })
  it('확정 거부 해제는 sending에서만 되고 succeeded·unknown은 유지된다', async () => {
    const { db } = fakeClaimDb()
    await claimOrder(db, 'r4')
    expect(await releaseSettled(db, 'r4')).toBe(false)
    await markSending(db, 'r4')
    expect(await releaseSettled(db, 'r4')).toBe(true)
    await claimOrder(db, 'r5')
    await markSending(db, 'r5')
    await markSucceeded(db, 'r5', 'O', 't', 'a1', '01')
    expect(await releaseSettled(db, 'r5')).toBe(false)
    expect(await claimOrder(db, 'r5')).toEqual({ outcome: 'done', orderNo: 'O', acceptedAt: 't' })
  })
  it('주문 번호로는 같은 계좌·상품의 클레임만 찾는다', async () => {
    const { db } = fakeClaimDb()
    await claimOrder(db, 'a1:01:r6')
    await markSending(db, 'a1:01:r6')
    await markSucceeded(db, 'a1:01:r6', 'O-6', 't', 'a1', '01')
    expect(await findClaimByOrder(db, 'a1', '01', 'O-6')).toMatchObject({ status: 'succeeded' })
    expect(await findClaimByOrder(db, 'a2', '01', 'O-6')).toBeNull()
    expect(await findClaimByOrder(db, 'a1', '01', 'O-9')).toBeNull()
  })
})
