import { describe, expect, it } from 'vitest'
import { portfolioItemSchema } from '../../../src/domain/portfolio/item'

const security = { kind: 'security', stockCode: '123456', stockName: '예시 ETF', targetWeightBps: 6000 }
const cash = { kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: 4000 }
const messages = (result: ReturnType<typeof portfolioItemSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.message)

describe('portfolio item', () => {
  it('보안 종목과 현금 항목을 모두 인정한다', () => {
    expect(portfolioItemSchema.safeParse(security).success).toBe(true)
    expect(portfolioItemSchema.safeParse(cash).success).toBe(true)
  })

  it('종목 코드와 이름을 정규화한다', () => {
    const parsed = portfolioItemSchema.safeParse({ ...security, stockCode: '  aBc.1 ', stockName: ' 예시 ' })
    expect(parsed.success && parsed.data.stockCode).toBe('ABC.1')
    expect(parsed.success && parsed.data.stockName).toBe('예시')
  })

  it('종목 코드는 대문자 영숫자 점 밑줄 하이픈 1~20자만 허용한다', () => {
    expect(portfolioItemSchema.safeParse({ ...security, stockCode: 'ABC.1_X-2' }).success).toBe(true)
    expect(messages(portfolioItemSchema.safeParse({ ...security, stockCode: '한글' }))).toContain('INVALID_STOCK_CODE')
    expect(messages(portfolioItemSchema.safeParse({ ...security, stockCode: 'A'.repeat(21) }))).toContain('INVALID_STOCK_CODE')
  })

  it('금액은 1~10000bp 정수만 허용한다', () => {
    expect(messages(portfolioItemSchema.safeParse({ ...security, targetWeightBps: 0 }))).toContain('INVALID_WEIGHT')
    expect(messages(portfolioItemSchema.safeParse({ ...security, targetWeightBps: 10001 }))).toContain('INVALID_WEIGHT')
    expect(messages(portfolioItemSchema.safeParse({ ...security, targetWeightBps: 1.5 }))).toContain('INVALID_WEIGHT')
  })

  it('현금 항목은 종목 코드가 없고 이름이 고정이다', () => {
    expect(messages(portfolioItemSchema.safeParse({ ...cash, stockCode: 'CASH' }))).toContain('INVALID_STOCK_CODE')
    expect(messages(portfolioItemSchema.safeParse({ ...cash, stockName: '현금' }))).toContain('INVALID_STOCK_NAME')
  })

  it('알 수 없는 필드는 거부한다', () => {
    expect(portfolioItemSchema.safeParse({ ...security, extra: 1 }).success).toBe(false)
  })
})
