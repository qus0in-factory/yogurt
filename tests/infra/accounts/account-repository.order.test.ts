// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { createAccountRepository } from '../../../src/infra/accounts/account-repository'

function setup() {
  const rows = ['a', 'b'].map((id, sort_order) => ({ id, sort_order, alias: id,
    owner: '소유자', account_number: '12345678', created_at: '2026-01-01' }))
  const run = vi.fn()
  const prepare = vi.fn((sql: string) => ({
    all: async () => ({ results: [...rows].sort((a, b) => a.sort_order - b.sort_order) }),
    bind: (...args: unknown[]) => ({ sql, args, run,
      all: async () => ({ results: [] }),
    }),
  }))
  const batch = vi.fn(async (statements: { args: unknown[] }[]) => {
    for (const { args: [order, id] } of statements) rows.find(row => row.id === id)!.sort_order = Number(order)
    return statements.map(() => ({ meta: { changes: 1 } }))
  })
  return { repo: createAccountRepository({ prepare, batch } as unknown as D1Database), prepare, batch, run }
}
it('정확한 순열은 모든 UPDATE를 한 batch로 저장하고 새 순서의 계좌를 반환한다', async () => {
  const { repo, prepare, batch, run } = setup()
  const result = await repo.reorder(['b', 'a'])
  expect(result?.map(account => account.id)).toEqual(['b', 'a'])
  expect(prepare).toHaveBeenCalledWith('SELECT id FROM accounts')
  const statements = batch.mock.calls[0][0]
  expect(statements).toEqual([
    expect.objectContaining({ sql: 'UPDATE accounts SET sort_order = ? WHERE id = ?', args: [0, 'b'] }),
    expect.objectContaining({ sql: 'UPDATE accounts SET sort_order = ? WHERE id = ?', args: [1, 'a'] }),
  ])
  expect(batch).toHaveBeenCalledTimes(1)
  expect(run).not.toHaveBeenCalled()
})
it.each([[], ['a'], ['a', 'a'], ['a', 'missing'], ['a', 'b', 'c']].map(ids => ({ ids })))('순열이 아닌 %j는 쓰기 없이 null이다', async ({ ids }) => {
  const { repo, batch } = setup()
  expect(await repo.reorder(ids)).toBeNull()
  expect(batch).not.toHaveBeenCalled()
})
it('batch 실패를 전달하고 독립 UPDATE는 실행하지 않는다', async () => {
  const { repo, batch, run } = setup()
  batch.mockRejectedValueOnce(new Error('transaction failed'))
  await expect(repo.reorder(['b', 'a'])).rejects.toThrow('transaction failed')
  expect(run).not.toHaveBeenCalled()
})
it('마이그레이션은 sort_order 기본값과 created_at 기준 백필을 정의한다', () => {
  const sql = readFileSync(new URL('../../../infra/migrations/0007_account_sort_order.sql', import.meta.url), 'utf8')
  expect(sql).toContain('ALTER TABLE accounts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0')
  expect(sql.replace(/\s+/g, ' ')).toContain('UPDATE accounts SET sort_order = (SELECT COUNT(*) FROM accounts a2 WHERE a2.created_at < accounts.created_at)')
})
