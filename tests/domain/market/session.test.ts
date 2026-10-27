import { describe, expect, it } from 'vitest'
import { isMarketOpen } from '../../../src/domain/market/session.ts'
import { MARKET_HOLIDAYS } from '../../../src/domain/market/holidays.ts'

const status = (time: string, holidays: string[] = []) => isMarketOpen(new Date(time), holidays)
describe('KST market session', () => {
  it.each([
    ['09:00:00', true, 'open'], ['15:29:00', true, 'open'],
    ['15:30:00', false, 'closed-hours'], ['08:59:00', false, 'closed-hours'],
  ])('%s boundary returns %s / %s', (time, open, reason) => {
    expect(status(`2026-10-27T${time}+09:00`)).toMatchObject({ open, reason })
  })
  it('Saturday is weekend, including when also listed as a holiday', () => {
    expect(status('2026-10-31T10:00:00+09:00', ['2026-10-31'])).toMatchObject({ open: false, reason: 'weekend' })
  })
  it('a weekday holiday is closed', () => {
    expect(status('2026-10-09T10:00:00+09:00', MARKET_HOLIDAYS)).toMatchObject({ open: false, reason: 'holiday' })
  })
  it.each([
    ['2026-10-27T08:59:00+09:00', [], '2026-10-27T00:00:00.000Z'],
    ['2026-10-27T15:30:00+09:00', [], '2026-10-28T00:00:00.000Z'],
    ['2026-10-30T16:00:00+09:00', [], '2026-11-02T00:00:00.000Z'],
    ['2026-10-31T10:00:00+09:00', ['2026-11-02'], '2026-11-03T00:00:00.000Z'],
    ['2026-10-27T09:00:00+09:00', [], '2026-10-28T00:00:00.000Z'],
    ['2026-09-23T16:00:00+09:00', MARKET_HOLIDAYS, '2026-09-28T00:00:00.000Z'],
  ])('next opening after %s is a trading day at 09:00 KST', (now, holidays, nextOpenAt) => {
    expect(status(now, holidays).nextOpenAt).toBe(nextOpenAt)
  })
  it('includes public holidays, substitutes, election day and 2026 additions', () => {
    expect(MARKET_HOLIDAYS).toEqual(expect.arrayContaining([
      '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
      '2026-03-02', '2026-05-01', '2026-05-25', '2026-06-03',
      '2026-07-17', '2026-08-17', '2026-10-05', '2026-12-25',
    ]))
  })
})
