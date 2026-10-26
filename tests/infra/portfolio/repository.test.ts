// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  assignmentCount, createPortfolio, getPortfolio, listPortfolios, removePortfolio, updatePortfolio,
} from '../../../src/infra/portfolio/repository.ts'
import { draft, fakeDb } from './fixtures.ts'

describe('portfolio repository', () => {
  it('생성은 헤더와 항목 주문을 한 batch로 실행한다', async () => {
    const { db, calls } = fakeDb()
    await createPortfolio(db, draft, '2026-10-26T00:00:00.000Z', 'p1')
    expect(calls.find((call) => call.sql === 'BATCH')?.args[0]).toBe(3)
    expect(calls[0].sql).toContain('INSERT INTO portfolios')
    expect(calls[1].sql).toContain('INSERT INTO portfolio_items')
  })

  it('수정은 헤더 갱신과 기존 항목 삭제, 새 항목 추가를 한 batch로 실행한다', async () => {
    const { db, calls } = fakeDb()
    await updatePortfolio(db, 'p1', draft, '2026-10-26T01:00:00.000Z')
    expect(calls.find((call) => call.sql === 'BATCH')?.args[0]).toBe(4)
    expect(calls[0].sql).toContain('UPDATE portfolios SET name = ?')
    expect(calls[1].sql).toContain('DELETE FROM portfolio_items')
  })

  it('목록·单项 조회는 이름 고정 순서와 position 순서를 쓴다', async () => {
    const { db, calls } = fakeDb({ portfolios: [{ id: 'p1', name: 'A', created_at: 't', updated_at: 't' }], items: [] })
    await listPortfolios(db)
    expect(calls[0].sql).toContain('ORDER BY name ASC, created_at ASC')
    expect(calls[1].sql).toContain('ORDER BY position ASC')
    await getPortfolio(db, 'p1')
    expect(calls[2].sql).toContain('WHERE id = ?')
  })

  it('연결 수는 portfolio_id로 세고 삭제는 헤더만 지운다', async () => {
    const { db, calls } = fakeDb()
    expect(await assignmentCount(db, 'p1')).toBe(3)
    await removePortfolio(db, 'p1')
    expect(calls[1].sql).toContain('DELETE FROM portfolios WHERE id = ?')
  })
})
