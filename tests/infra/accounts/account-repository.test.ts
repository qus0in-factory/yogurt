// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../../src/infra/accounts/account-repository.ts'

const key = btoa(String.fromCharCode(...new Uint8Array(32).fill(3)))
const input = { alias: 'Primary', owner: '홍길동', accountNumber: '12345678', accessKey: 'AK_plain_1234', secretKey: 'SK_plain_secret' }
const row = { id: 'a', alias: 'Main', owner: '홍길동', account_number: '12345678', created_at: '2026-01-01T00:00:00.000Z' }
function fakeDb(rows: unknown[] = []) {
  const calls: { sql: string; args: unknown[] }[] = []
  const db = { prepare: (sql: string) => ({
    all: async () => {
      calls.push({ sql, args: [] })
      if (sql.includes('account_products')) return { results: [] }
      return { results: rows }
    },
    bind: (...args: unknown[]) => {
      calls.push({ sql, args })
      return {
        run: async () => ({ success: true, meta: { changes: rows.length ? 1 : 0 } }),
        first: async () => (sql.includes('account_products') ? null : (rows[0] ?? null)),
        all: async () => {
          if (sql.includes('account_products')) return { results: [] }
          return { results: rows }
        },
      }
    },
  }) } as unknown as D1Database
  return { db, calls }
}

describe('account repository', () => {
  it('별칭·소유자·계좌번호는 평문, access/secret key는 암호문으로 저장한다', async () => {
    const { db, calls } = fakeDb()
    const account = await createAccountRepository(db).create(input, key)
    expect(calls[0].sql).toContain('sort_order) SELECT ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order) + 1, 0) FROM accounts')
    expect(calls[0].args.slice(1, 4)).toEqual(['Primary', '홍길동', '12345678'])
    expect(calls[0].args).not.toContain('AK_plain_1234')
    expect(calls[0].args).not.toContain('SK_plain_secret')
    expect(calls[0].args[4]).toMatch(/^v1:/)
    expect(calls[0].args[5]).toMatch(/^v1:/)
    expect(account).toEqual({ id: expect.any(String), alias: 'Primary', owner: '홍길동', accountNumber: '12345678', products: [], createdAt: expect.any(String) })
    expect(account).not.toHaveProperty('secretKey')
  })

  it('sort_order·created_at 오름차순 목록에 products를 포함한다', async () => {
    const { db, calls } = fakeDb([row])
    const accounts = await createAccountRepository(db).list()
    expect(calls[0].sql).toContain('ORDER BY sort_order ASC, created_at ASC')
    expect(accounts).toEqual([{ id: 'a', alias: 'Main', owner: '홍길동', accountNumber: '12345678', products: [], createdAt: row.created_at }])
  })

  it('update는 별칭·소유자·id만 바인딩하고 키 컬럼을 수정하지 않는다', async () => {
    const { db, calls } = fakeDb([{ ...row, alias: 'New', owner: '김철수' }])
    const account = await createAccountRepository(db).update('a', { alias: 'New', owner: '김철수' })
    expect(calls[0].args).toEqual(['New', '김철수', 'a'])
    expect(calls[0].sql).toMatch(/UPDATE accounts SET alias = \?, owner = \? WHERE id = \?/)
    expect(calls[0].sql).not.toMatch(/access_key|secret_key|product_code/)
    expect(account).toMatchObject({ id: 'a', alias: 'New', owner: '김철수', accountNumber: row.account_number, products: [], createdAt: row.created_at })
  })

  it('update 대상이 없으면 null이다', async () => {
    expect(await createAccountRepository(fakeDb().db).update('missing', { alias: 'New', owner: '김철수' })).toBeNull()
  })
})
