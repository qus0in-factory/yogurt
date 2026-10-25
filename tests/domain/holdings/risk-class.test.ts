import { describe, expect, it } from 'vitest'
import { riskClassSchema, stockCodeSchema, riskClassUpdateSchema } from '../../../src/domain/holdings/risk-class.ts'

describe('risk-class domain schemas', () => {
  it('riskClassSchema allows risk and safe', () => {
    expect(riskClassSchema.parse('risk')).toBe('risk')
    expect(riskClassSchema.parse('safe')).toBe('safe')
    expect(() => riskClassSchema.parse('other')).toThrow()
  })

  it('stockCodeSchema validates 1-12 alphanumeric uppercase characters', () => {
    expect(stockCodeSchema.parse('005930')).toBe('005930')
    expect(stockCodeSchema.parse('AAPL')).toBe('AAPL')
    expect(stockCodeSchema.parse('A')).toBe('A')
    expect(() => stockCodeSchema.parse('')).toThrow()
    expect(() => stockCodeSchema.parse('lowercase')).toThrow()
    expect(() => stockCodeSchema.parse('1234567890123')).toThrow()
    expect(() => stockCodeSchema.parse('005930-A')).toThrow()
  })

  it('riskClassUpdateSchema validates object with riskClass', () => {
    expect(riskClassUpdateSchema.parse({ riskClass: 'risk' })).toEqual({ riskClass: 'risk' })
    expect(riskClassUpdateSchema.parse({ riskClass: 'safe' })).toEqual({ riskClass: 'safe' })
    expect(() => riskClassUpdateSchema.parse({})).toThrow()
    expect(() => riskClassUpdateSchema.parse({ riskClass: 'invalid' })).toThrow()
  })
})
