import { describe, expect, it } from 'vitest'
import { allowedBuyQuantity, buyLimitCash } from '../../../src/domain/rebalance/buy-limit'

describe('buy limit', () => {
  it('매수 한도는 정산 현금에서 남길 금액을 뺀 값이고 음수는 0이다', () => {
    expect(buyLimitCash(10_000_000, 3_000_000)).toBe(7_000_000)
    expect(buyLimitCash(2_000_000, 3_000_000)).toBe(0)
  })
  it('허용 수량은 계획 수량과 한도 내 수량 중 작은 정수다', () => {
    expect(allowedBuyQuantity(10, 1_000_000, 10_000)).toBe(10)
    expect(allowedBuyQuantity(10, 55_000, 10_000)).toBe(5)
    expect(allowedBuyQuantity(10, 0, 10_000)).toBe(0)
    expect(allowedBuyQuantity(10, 1_000_000, 0)).toBe(0)
  })
})
