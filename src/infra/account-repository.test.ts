// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createAccountRepository } from './account-repository.ts'

const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(3)))
const input = { alias: 'Primary', accountNumber: '1234-5678', accessKey: 'AK_plain_1234', secretKey: 'SK_plain_secret' }
function fakeDb(rows: unknown[] = []) {
  const calls: { sql: string; args: unknown[] }[] = []
  const db = { prepare: (sql: string) => ({
    all: async () => (calls.push({ sql, args: [] }), { results: rows }),
    bind: (...args: unknown[]) => (calls.push({ sql, args }), { run: async () => ({ success: true }) }),
  }) } as unknown as D1Database
  return { db, calls }
}

describe('account repository', () => {
  it('별칭·계좌번호를 평문, access/secret key를 암호문으로 저장한다', async () => {
    const { db, calls } = fakeDb()
    const account = await createAccountRepository(db).create(input, key)
    expect(calls[0].args[1]).toBe('Primary')
    expect(calls[0].args[2]).toBe('1234-5678')
    expect(calls[0].args).not.toContain('AK_plain_1234')
    expect(calls[0].args).not.toContain('SK_plain_secret')
    expect(calls[0].args[3]).toMatch(/^v1:/)
    expect(calls[0].args[4]).toMatch(/^v1:/)
    expect(account).toEqual({ id: expect.any(String), alias: 'Primary', accountNumber: '1234-5678', createdAt: expect.any(String) })
    expect(account).not.toHaveProperty('secretKey')
  })

  it('created_at 오름차순 목록을 새 Account 계약으로 반환한다', async () => {
    const row = { id: 'a', alias: 'Main', account_number: '1234-5678', created_at: '2026-01-01T00:00:00.000Z' }
    const { db, calls } = fakeDb([row])
    const accounts = await createAccountRepository(db).list()
    expect(calls[0].sql).toContain('ORDER BY created_at ASC')
    expect(accounts).toEqual([{ id: 'a', alias: 'Main', accountNumber: '1234-5678', createdAt: row.created_at }])
  })
})
