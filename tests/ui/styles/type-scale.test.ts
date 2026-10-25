import { describe, expect, it } from 'vitest'
import { spacing, typeScale } from '../../../src/ui/styles/type-scale'

describe('type scale', () => {
  it('제목에서 캡션으로 갈수록 글자 크기가 작아진다', () => {
    const sizes = ['pageTitle', 'sectionTitle', 'cardTitle', 'body', 'caption'] as const
    const order = ['text-2xl', 'text-lg', 'text-base', 'text-sm', 'text-xs']
    expect(sizes.map((key) => typeScale[key].split(' ')[0])).toEqual(order)
  })

  it('숫자 표시는 자릿수 폭을 맞춘다', () => {
    expect(typeScale.figure).toContain('tabular-nums')
    expect(typeScale.number).toContain('tabular-nums')
  })

  it('카드와 페이지는 모바일보다 데스크톱에서 여백이 넓다', () => {
    expect(spacing.card).toMatch(/p-5 md:p-6/)
    expect(spacing.page).toMatch(/p-4 md:p-8/)
  })
})
