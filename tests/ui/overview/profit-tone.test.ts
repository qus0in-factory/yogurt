import { describe, expect, it } from 'vitest'
import { profitTone } from '../../../src/ui/overview/profit-tone'

describe('profitTone', () => {
  it('양수는 + 부호와 빨간색이다', () => {
    expect(profitTone(2000)).toEqual({ className: 'text-red-600', sign: '+' })
  })

  it('음수는 - 부호와 파란색이다', () => {
    expect(profitTone(-2000)).toEqual({ className: 'text-blue-600', sign: '-' })
  })

  it('0은 부호 없이 회색이다', () => {
    expect(profitTone(0)).toEqual({ className: 'text-stone-500', sign: '' })
  })
})
