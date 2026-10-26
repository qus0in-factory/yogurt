import { describe, expect, it } from 'vitest'
import { spacing, typeScale } from '../../../src/ui/styles/type-scale'

describe('type scale role system', () => {
  it('7개 의미 역할 토큰과 호환 figure recipe만 정의되어 있고 옛 별칭은 제거되었다', () => {
    const coreRoles = ['pageTitle', 'section', 'title', 'body', 'number', 'label', 'caption'] as const
    for (const role of coreRoles) {
      expect(typeScale[role]).toBeDefined()
    }
    expect(typeScale).not.toHaveProperty('sectionTitle')
    expect(typeScale).not.toHaveProperty('cardTitle')
    expect(typeScale.figure).toContain('text-base')
    expect(typeScale.figure).toContain('md:text-2xl')
  })

  it('숫자 역할은 tabular-nums와 모바일 강조(16px/600), 데스크톱(14px/400)을 갖는다', () => {
    expect(typeScale.number).toContain('tabular-nums')
    expect(typeScale.number).toContain('text-base')
    expect(typeScale.number).toContain('font-semibold')
    expect(typeScale.number).toContain('md:text-sm')
    expect(typeScale.number).toContain('md:font-normal')
  })

  it('375px 모바일에서 라벨·캡션(최소12px)과 본문(최소14px) 기준을 만족한다', () => {
    expect(typeScale.label).toContain('text-xs')
    expect(typeScale.label).toContain('font-medium')
    expect(typeScale.caption).toContain('text-xs')
    expect(typeScale.body).toContain('text-sm')
  })

  it('데스크톱(md 이상) 행간과 글자 크기 기존 값을 엄격히 보존한다', () => {
    expect(typeScale.pageTitle).toContain('md:text-2xl')
    expect(typeScale.pageTitle).toContain('md:tracking-tight')
    expect(typeScale.section).toBe('text-lg font-semibold text-stone-900')
    expect(typeScale.title).toBe('text-base font-semibold text-stone-900')
    expect(typeScale.figure).toContain('md:text-2xl')
    expect(typeScale.body).toContain('md:leading-5')
    expect(typeScale.label).toContain('md:leading-4')
    expect(typeScale.caption).toContain('md:leading-4')
    expect(typeScale.body).not.toContain('md:leading-normal')
    expect(typeScale.label).not.toContain('md:leading-normal')
    expect(typeScale.caption).not.toContain('md:leading-normal')
  })

  it('카드와 페이지 여백은 모바일보다 데스크톱에서 넓다', () => {
    expect(spacing.card).toMatch(/p-5 md:p-6/)
    expect(spacing.page).toMatch(/p-4 md:p-8/)
  })
})
