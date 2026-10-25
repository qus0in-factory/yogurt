// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { createAccountRepository } from '../../../src/infra/accounts/account-repository'

function fakeDb(changes: number) {
  const run = vi.fn()
  const statements: unknown[] = []
  const prepare = vi.fn((sql: string) => ({ bind: (...args: unknown[]) => {
    const statement = { sql, args, run }
    statements.push(statement)
    return statement
  } }))
  const batch = vi.fn(async (_statements: unknown[]) => [
    { meta: { changes: 99 } }, { meta: { changes: 99 } }, { meta: { changes } },
  ])
  return { db: { prepare, batch } as unknown as D1Database, prepare, batch, run, statements }
}
it.each([[0, false], [1, true], [2, true]] as const)('계좌 삭제 결과 %i를 기준으로 %s를 반환한다', async (changes, expected) => {
  const { db, batch, run, statements } = fakeDb(changes)
  expect(await createAccountRepository(db).remove('a1')).toBe(expected)
  expect(statements).toEqual([
    { sql: 'DELETE FROM account_products WHERE account_id = ?', args: ['a1'], run },
    { sql: 'DELETE FROM holding_risk_classes WHERE account_id = ?', args: ['a1'], run },
    { sql: 'DELETE FROM accounts WHERE id = ?', args: ['a1'], run },
  ])
  expect(batch).toHaveBeenCalledExactlyOnceWith(statements)
  expect(run).not.toHaveBeenCalled()
})
it('원자적 삭제 batch가 실패하면 성공으로 처리하지 않고 오류를 전달한다', async () => {
  const { db, batch, run } = fakeDb(1)
  batch.mockRejectedValueOnce(new Error('storage failed'))
  await expect(createAccountRepository(db).remove('a1')).rejects.toThrow('storage failed')
  expect(batch).toHaveBeenCalledTimes(1)
  expect(run).not.toHaveBeenCalled()
})
