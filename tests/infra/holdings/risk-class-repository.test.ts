// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { createRiskClassRepository } from '../../../src/infra/holdings/risk-class-repository'

function fakeDb(exists = true, rows: unknown[] = []) {
  const first = vi.fn(async () => exists ? { id: 'a1' } : null)
  const run = vi.fn(async () => ({ meta: { changes: exists ? 1 : 0 } }))
  const bind = vi.fn((..._args: unknown[]) => ({ first, run, all: async () => ({ results: rows }) }))
  const prepare = vi.fn((_sql: string) => ({ bind }))
  return { db: { prepare } as unknown as D1Database, first, run, bind, prepare }
}
it('계좌가 없으면 조회는 null이고 분류 테이블은 읽지 않는다', async () => {
  const { db, prepare } = fakeDb(false)
  expect(await createRiskClassRepository(db).list('missing', '29')).toBeNull()
  expect(prepare).toHaveBeenCalledExactlyOnceWith('SELECT id FROM accounts WHERE id = ?')
})
it.each([['a1', '29'], ['a2', 'other-product']])('조회 SQL은 계좌 %s와 상품 %s를 모두 바인딩한다', async (id, product) => {
  const { db, prepare, bind } = fakeDb(true, [{ stock_code: 'AAPL', risk_class: 'safe' }])
  expect(await createRiskClassRepository(db).list(id, product)).toEqual({ AAPL: 'safe' })
  expect(prepare).toHaveBeenNthCalledWith(1, 'SELECT id FROM accounts WHERE id = ?')
  expect(bind).toHaveBeenNthCalledWith(1, id)
  expect(prepare).toHaveBeenNthCalledWith(2,
    'SELECT stock_code, risk_class FROM holding_risk_classes WHERE account_id = ? AND product_code = ?')
  expect(bind).toHaveBeenNthCalledWith(2, id, product)
})
it.each([true, false])('계좌 존재 여부 %s에 따라 조건부 단일 저장의 결과를 반환한다', async exists => {
  const { db, first, run, prepare, bind } = fakeDb(exists)
  const result = await createRiskClassRepository(db).set('a1', '29', '005930', 'safe')
  expect(result).toEqual(exists ? { stockCode: '005930', riskClass: 'safe' } : null)
  expect(prepare).toHaveBeenCalledExactlyOnceWith(
    'INSERT INTO holding_risk_classes (account_id, product_code, stock_code, risk_class) SELECT id, ?, ?, ? FROM accounts WHERE id = ? ON CONFLICT (account_id, product_code, stock_code) DO UPDATE SET risk_class = excluded.risk_class')
  expect(bind).toHaveBeenCalledExactlyOnceWith('29', '005930', 'safe', 'a1')
  expect(first).not.toHaveBeenCalled()
  expect(run).toHaveBeenCalledTimes(1)
})
