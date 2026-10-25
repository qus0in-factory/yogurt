import { describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../../src/infra/accounts/account-repository.ts'
import type { ProductPlanRequest } from '../../../src/domain/accounts/product-plan.ts'

const accountRow = { id: 'a', alias: 'Main', owner: '홍길동', account_number: '12345678', created_at: '2026-01-01' }

function fakeDb(enabled: boolean, plan: ProductPlanRequest) {
  const calls: { sql: string; args: unknown[] }[] = []
  const db = { prepare: (sql: string) => ({
    all: async () => ({ results: [accountRow] }),
    bind: (...args: unknown[]) => {
      calls.push({ sql, args })
      return {
        run: async () => ({ meta: { changes: enabled ? 1 : 0 } }),
        first: async () => accountRow,
        all: async () => ({
          results: enabled
            ? [{
                product_code: '01',
                start_date: plan.startDate,
                min_target_amount_won: plan.minTargetAmountWon,
                max_target_amount_won: plan.maxTargetAmountWon,
              }]
            : [],
        }),
      }
    },
  }) } as unknown as D1Database
  return { db, calls }
}

describe('account repository product plan', () => {
  it('updates start_date and won target amounts and maps them to productPlans', async () => {
    const plan = { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: 30_000_000 }
    const { db, calls } = fakeDb(true, plan)
    const account = await createAccountRepository(db).setProductPlan('a', '01', plan)
    expect(calls[0]).toEqual({
      sql: 'UPDATE account_products SET start_date = ?, min_target_amount_won = ?, max_target_amount_won = ? WHERE account_id = ? AND product_code = ?',
      args: ['2024-03-15', 12_500_000, 30_000_000, 'a', '01'],
    })
    expect(account).toMatchObject({
      products: ['01'],
      productPlans: { '01': plan },
    })
  })

  it('omits productPlans entry when plan is cleared with nulls while keeping product enabled', async () => {
    const cleared = { startDate: null, minTargetAmountWon: null, maxTargetAmountWon: null }
    const account = await createAccountRepository(fakeDb(true, cleared).db).setProductPlan('a', '01', cleared)
    expect(account).toMatchObject({ products: ['01'], productPlans: {} })
  })

  it('returns null when the product is not enabled', async () => {
    const cleared = { startDate: null, minTargetAmountWon: null, maxTargetAmountWon: null }
    expect(await createAccountRepository(fakeDb(false, cleared).db).setProductPlan('a', '01', cleared)).toBeNull()
  })
})
