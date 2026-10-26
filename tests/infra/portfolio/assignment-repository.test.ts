// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  assignTarget, listAssignments, portfolioExists, targetExists, unassignTarget,
} from '../../../src/infra/portfolio/assignment-repository.ts'
import { fakeDb } from './fixtures.ts'

describe('portfolio assignment repository', () => {
  it('연결은 대상·상품 기준으로 정렬해 조회한다', async () => {
    const { db, calls } = fakeDb()
    await listAssignments(db)
    expect(calls[0].sql).toContain('ORDER BY account_id ASC, product_code ASC')
  })

  it('연결 설정은 기존 연결을 교체하고 해제는 대상·상품만 지운다', async () => {
    const { db, calls } = fakeDb()
    await assignTarget(db, 'a1', '29', 'p1')
    expect(calls[0].sql).toContain('ON CONFLICT(account_id, product_code) DO UPDATE')
    await unassignTarget(db, 'a1', '29')
    expect(calls[1].sql).toContain('DELETE FROM portfolio_assignments WHERE account_id = ? AND product_code = ?')
  })

  it('활성 상품과 포트폴리오 존재를 각각 확인한다', async () => {
    const { db, calls } = fakeDb({ target: { account_id: 'a1' } })
    expect(await targetExists(db, 'a1', '29')).toBe(true)
    expect(await portfolioExists(db, 'p1')).toBe(false)
    expect(calls[0].sql).toContain('FROM account_products')
    expect(calls[1].sql).toContain('FROM portfolios WHERE id = ?')
  })
})
