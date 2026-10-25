import { describe, expect, it } from 'vitest'
import { overviewText } from '../../../src/ui/glossary/overview'
import { withObjectParticle } from '../../../src/ui/lib/josa'

describe('withObjectParticle', () => {
  it.each([
    ['연금저축', '연금저축을'],
    ['계좌', '계좌를'],
    ['가', '가를'],
    ['각', '각을'],
    ['힣', '힣을'],
    ['ISA', 'ISA를'],
    ['IRP', 'IRP를'],
    ['', ''],
  ])('%s → %s', (word, expected) => {
    expect(withObjectParticle(word)).toBe(expected)
  })

  it.each([...'LMNRlmnr013678'])('%s로 끝나면 을을 붙인다', (last) => {
    expect(withObjectParticle(`상품${last}`)).toBe(`상품${last}을`)
  })

  it.each([...'ABCDEFGHIJKOPQSTUVWXYZabcdefghijkopqstuvwxyz2459'])(
    '%s로 끝나면 를을 붙인다', (last) => {
      expect(withObjectParticle(`상품${last}`)).toBe(`상품${last}를`)
    },
  )
})

describe('overview glossary object particles', () => {
  it.each([['ISA', 'ISA를'], ['IRP', 'IRP를'], ['연금저축', '연금저축을']])(
    '상품 %s의 빈 상태 안내에 조사를 선택한다', (label, expected) => {
      expect(overviewText.productEmptyHint(label))
        .toBe(`계좌 카드에서 ${expected} 켜면 여기에 표시됩니다`)
    },
  )

  it.each([['100만원', '100만원을'], ['102', '102를']])(
    '필요 담보 %s의 안내에 조사를 선택한다', (required, expected) => {
      expect(overviewText.maxLoanTooltip('50만원', 50, required))
        .toContain(`≈ ${expected} 넘으면`)
    },
  )
})
