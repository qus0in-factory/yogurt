import { describe, expect, it } from 'vitest'
import type { RebalanceItem } from '../../../../src/domain/rebalance/types'
import { sortRebalanceRows } from '../../../../src/ui/operations/rebalance/sort-items'

const item = (code: string, side: RebalanceItem['side'], orderQuantity: number): RebalanceItem =>
  ({ code, name: code, targetQuantity: 0, currentQuantity: 0, orderQuantity, side })

describe('리밸런싱 표 정렬', () => {
  it('매도를 예상 금액 내림차순으로 먼저 둔다', () => {
    const rows = sortRebalanceRows(
      [item('B', 'sell', 1), item('A', 'sell', 3), item('C', 'sell', 2)],
      { A: 100, B: 100, C: 100 },
    )
    expect(rows.map((r) => r.code)).toEqual(['A', 'C', 'B'])
  })

  it('매도 다음에 매수를 두고 변경 없음은 맨 아래에 둔다', () => {
    const rows = sortRebalanceRows(
      [item('N', 'none', 0), item('U', 'buy', 1), item('S', 'sell', 1)],
      { N: 100, U: 100, S: 100 },
    )
    expect(rows.map((r) => r.code)).toEqual(['S', 'U', 'N'])
  })

  it('금액이 같으면 종목 코드 오름차순으로 고정한다', () => {
    const rows = sortRebalanceRows(
      [item('B2', 'buy', 1), item('B1', 'buy', 2), item('B3', 'buy', 1)],
      { B1: 100, B2: 200, B3: 100 },
    )
    expect(rows.map((r) => r.code)).toEqual(['B1', 'B2', 'B3'])
  })

  it('가격 없는 항목은 예상 금액 0으로 보고 구분 안에서 맨 아래에 둔다', () => {
    const rows = sortRebalanceRows(
      [item('X', 'sell', 5), item('Y', 'sell', 1)],
      { Y: 100 },
    )
    expect(rows.map((r) => r.code)).toEqual(['Y', 'X'])
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const items = [item('B', 'sell', 1), item('A', 'sell', 3)]
    sortRebalanceRows(items, { A: 100, B: 100 })
    expect(items.map((r) => r.code)).toEqual(['B', 'A'])
  })
})
