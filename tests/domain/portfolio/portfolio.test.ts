import { describe, expect, it } from 'vitest'
import { portfolioDraftSchema } from '../../../src/domain/portfolio/portfolio'

const security = (code: string, bps: number) => ({ kind: 'security', stockCode: code, stockName: `종목${code}`, targetWeightBps: bps })
const cash = (bps: number) => ({ kind: 'cash', stockCode: null, stockName: '현금/예수금', targetWeightBps: bps })
const draft = (items: unknown[], name = '중립형 목표') => ({ name, items })
const messages = (result: ReturnType<typeof portfolioDraftSchema.safeParse>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.message)

describe('portfolio draft', () => {
  it('이름과 항목을 정규화하고 합계 100%를 인정한다', () => {
    const parsed = portfolioDraftSchema.safeParse(draft([security('123456', 6000), cash(4000)], '  중립형 목표 '))
    expect(parsed.success && parsed.data.name).toBe('중립형 목표')
    expect(parsed.success).toBe(true)
  })

  it('빈 이름과 빈 항목을 거부한다', () => {
    expect(messages(portfolioDraftSchema.safeParse(draft([cash(10000)], '   ')))).toContain('REQUIRED')
    expect(messages(portfolioDraftSchema.safeParse(draft([])))).toContain('REQUIRED')
  })

  it('이름은 40자까지 허용한다', () => {
    expect(portfolioDraftSchema.safeParse(draft([cash(10000)], 'a'.repeat(40))).success).toBe(true)
    expect(messages(portfolioDraftSchema.safeParse(draft([cash(10000)], 'a'.repeat(41))))).toContain('INVALID_NAME')
  })

  it('항목은 1~100개만 허용한다', () => {
    const many = Array.from({ length: 100 }, () => security('123456', 100))
    expect(portfolioDraftSchema.safeParse(draft(many)).success).toBe(false)
    expect(messages(portfolioDraftSchema.safeParse(draft([...many, security('999999', 100)])))).toContain('TOO_MANY_ITEMS')
  })

  it('비중 합계는 정확히 10000bp만 통과한다', () => {
    expect(messages(portfolioDraftSchema.safeParse(draft([security('123456', 9999)])))).toContain('TOTAL_NOT_100')
    expect(messages(portfolioDraftSchema.safeParse(draft([security('123456', 9999), security('654321', 2)])))).toContain('TOTAL_NOT_100')
    expect(portfolioDraftSchema.safeParse(draft([security('123456', 9999), security('654321', 1)])).success).toBe(true)
  })

  it('정규화한 종목 코드가 중복이면 거부한다', () => {
    expect(messages(portfolioDraftSchema.safeParse(draft([security('abc123', 5000), security('ABC123', 5000)])))).toContain('DUPLICATE_STOCK')
  })

  it('이름이 같아도 코드가 다르면 허용한다', () => {
    expect(portfolioDraftSchema.safeParse(draft([security('123456', 5000), security('654321', 5000)])).success).toBe(true)
  })

  it('현금은 최대 1개만 허용한다', () => {
    expect(messages(portfolioDraftSchema.safeParse(draft([cash(5000), cash(5000)])))).toContain('DUPLICATE_CASH')
  })

  it('현금만 100% 또는 종목만 100%를 허용한다', () => {
    expect(portfolioDraftSchema.safeParse(draft([cash(10000)])).success).toBe(true)
    expect(portfolioDraftSchema.safeParse(draft([security('123456', 10000)])).success).toBe(true)
  })
})
