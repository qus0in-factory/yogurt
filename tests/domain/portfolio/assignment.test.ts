import { describe, expect, it } from 'vitest'
import { portfolioAssignmentRequestSchema, portfolioAssignmentSchema } from '../../../src/domain/portfolio/assignment'

describe('portfolio assignment', () => {
  it('연결 대상과 포트폴리오 식별자를 요구한다', () => {
    expect(portfolioAssignmentRequestSchema.safeParse({ portfolioId: 'p1' }).success).toBe(true)
    expect(portfolioAssignmentRequestSchema.safeParse({ portfolioId: '  ' }).success).toBe(false)
    expect(portfolioAssignmentRequestSchema.safeParse({ portfolioId: 'p1', extra: 1 }).success).toBe(false)
  })

  it('응답은 계좌·상품·포트폴리오를 담는다', () => {
    expect(portfolioAssignmentSchema.safeParse({ accountId: 'a1', productCode: '29', portfolioId: 'p1' }).success).toBe(true)
  })

  it('상품 코드는 01·22·29만 허용한다', () => {
    expect(portfolioAssignmentSchema.safeParse({ accountId: 'a1', productCode: '99', portfolioId: 'p1' }).success).toBe(false)
  })
})
