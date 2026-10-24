// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { createAccountRepository } from '../../../src/infra/accounts/account-repository'

function fakeDb(changes: number) {
  const run = vi.fn(async () => ({ meta: { changes } }))
  const bind = vi.fn(() => ({ run }))
  const prepare = vi.fn(() => ({ bind }))
  return { db: { prepare } as unknown as D1Database, prepare, bind, run }
}

it.each([[0, false], [1, true], [2, true]] as const)('remove는 삭제 행 수 %i에 대해 %s를 반환한다', async (changes, expected) => {
  const { db, prepare, bind, run } = fakeDb(changes)
  expect(await createAccountRepository(db).remove('a1')).toBe(expected)
  expect(prepare).toHaveBeenCalledExactlyOnceWith('DELETE FROM accounts WHERE id = ?')
  expect(bind).toHaveBeenCalledExactlyOnceWith('a1')
  expect(run).toHaveBeenCalledOnce()
})

it('D1 삭제 오류는 성공으로 처리하지 않고 전달한다', async () => {
  const { db, run } = fakeDb(1)
  run.mockRejectedValueOnce(new Error('storage failed'))
  await expect(createAccountRepository(db).remove('a1')).rejects.toThrow('storage failed')
})
