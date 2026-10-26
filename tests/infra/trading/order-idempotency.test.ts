import { describe, expect, it } from 'vitest'
import { claimOrder, markSending, markSucceeded, markUnknown, releaseClaimed, releaseSettled } from '../../../src/infra/trading/order-idempotency.ts'

export function fakeClaimDb(failures: { update?: boolean; failOn?: string } = {}) {
  const rows = new Map<string, { status: string; order_no: string | null; accepted_at: string | null }>()
  const db = {
    prepare(sql: string) {
      return {
        bind: (...args: unknown[]) => ({
          run: async () => {
            if (sql.startsWith('UPDATE') && (failures.update || (failures.failOn && sql.includes(failures.failOn)))) throw new Error('D1 write failed')
            if (sql.startsWith('INSERT')) {
              const id = args[0] as string
              if (rows.has(id)) throw new Error('UNIQUE constraint failed: order_claims.request_id')
              rows.set(id, { status: 'claimed', order_no: null, accepted_at: null })
            } else if (sql.startsWith('UPDATE')) {
              const id = args[args.length - 2] as string
              const from = args[args.length - 1] as string
              const row = rows.get(id)
              if (!row || row.status !== from) return { success: true, meta: { changes: 0 } }
              if (sql.includes("status = 'sending'")) row.status = 'sending'
              if (sql.includes("status = 'succeeded'")) { row.status = 'succeeded'; row.order_no = args[0] as string; row.accepted_at = args[1] as string }
              if (sql.includes("status = 'unknown'")) row.status = 'unknown'
              return { success: true, meta: { changes: 1 } }
            } else if (sql.startsWith('DELETE')) {
              const wanted = sql.match(/AND status = '(\w+)'/)?.[1]
              const row = rows.get(args[0] as string)
              if (row && (!wanted || row.status === wanted)) { rows.delete(args[0] as string); return { success: true, meta: { changes: 1 } } }
              return { success: true, meta: { changes: 0 } }
            }
            return { success: true, meta: { changes: 0 } }
          },
          first: async () => {
            const row = rows.get(args[0] as string)
            return row ? { status: row.status, order_no: row.order_no, accepted_at: row.accepted_at } : null
          },
        }),
      }
    },
  } as unknown as D1Database
  return { db, rows }
}

describe('주문 클레임 상태 전이', () => {
  it('claimed → sending → succeeded 후에는 저장 결과를 돌려준다', async () => {
    const { db } = fakeClaimDb()
    expect(await claimOrder(db, 'r1')).toEqual({ outcome: 'claimed' })
    expect(await claimOrder(db, 'r1')).toEqual({ outcome: 'processing' })
    expect(await markSending(db, 'r1')).toBe(true)
    expect(await releaseClaimed(db, 'r1')).toBe(false)
    expect(await markSucceeded(db, 'r1', 'ORD-1', 't')).toBe(true)
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
    await markSucceeded(db, 'r5', 'O', 't')
    expect(await releaseSettled(db, 'r5')).toBe(false)
    expect(await claimOrder(db, 'r5')).toEqual({ outcome: 'done', orderNo: 'O', acceptedAt: 't' })
  })
})
