// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  getKeepAmount, keepAmountTargetExists, saveKeepAmount,
} from '../../../src/infra/rebalance/keep-amount-repository.ts'

type Call = { sql: string; args: unknown[] }

function fakeDb(options: { target?: boolean; keep?: number } = {}) {
  const calls: Call[] = []
  const db = {
    prepare(sql: string) {
      return {
        bind: (...args: unknown[]) => {
          calls.push({ sql, args })
          return {
            first: async () => sql.includes('account_products')
              ? (options.target === false ? null : { account_id: 'a1' })
              : (options.keep === undefined ? null : { keep_amount: options.keep }),
            run: async () => ({ success: true, meta: { changes: 1 } }),
          }
        },
      }
    },
  } as unknown as D1Database
  return { db, calls }
}

describe('rebalance keep amount repository', () => {
  it('행이 없으면 0을 반환하고 계좌·상품 키로 조회한다', async () => {
    const { db, calls } = fakeDb()
    expect(await getKeepAmount(db, 'a1', '01')).toBe(0)
    expect(calls[0].sql).toContain('FROM rebalance_keep_amounts')
    expect(calls[0].args).toEqual(['a1', '01'])
    const stored = fakeDb({ keep: 4200 })
    expect(await getKeepAmount(stored.db, 'a1', '22')).toBe(4200)
  })

  it('대상 계좌·상품 존재를 account_products에서 확인한다', async () => {
    const { db, calls } = fakeDb({ target: false })
    expect(await keepAmountTargetExists(db, 'a1', '01')).toBe(false)
    expect(calls[0].sql).toContain('FROM account_products')
  })

  it('저장은 (account_id, product_code) upsert이고 금액·시각을 함께 쓴다', async () => {
    const { db, calls } = fakeDb()
    await saveKeepAmount(db, 'a1', '01', 1234)
    expect(calls[0].sql).toContain('ON CONFLICT(account_id, product_code) DO UPDATE')
    expect(calls[0].args.slice(0, 3)).toEqual(['a1', '01', 1234])
    expect(typeof calls[0].args[3]).toBe('string')
  })
})
