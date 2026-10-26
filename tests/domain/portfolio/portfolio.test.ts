import { describe, expect, it } from 'vitest'
import { MAX_PORTFOLIO_ITEMS } from '../../../src/domain/portfolio/limits'
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

  it('항목은 최대 7개까지 허용한다', () => {
    expect(MAX_PORTFOLIO_ITEMS).toBe(7)
    const seven = [...Array.from({ length: 6 }, (_, i) => security(`10000${i}`, 1000)), security('200000', 4000)]
    expect(portfolioDraftSchema.safeParse(draft(seven)).success).toBe(true)
    const eight = [...Array.from({ length: 7 }, (_, i) => security(`10000${i}`, 1000)), security('200000', 3000)]
    expect(messages(portfolioDraftSchema.safeParse(draft(eight)))).toContain('TOO_MANY_ITEMS')
  })

  it('현금을 포함해 8개면 거부한다', () => {
    const items = [...Array.from({ length: 7 }, (_, i) => security(`10000${i}`, 1000)), cash(3000)]
    expect(messages(portfolioDraftSchema.safeParse(draft(items)))).toContain('TOO_MANY_ITEMS')
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
