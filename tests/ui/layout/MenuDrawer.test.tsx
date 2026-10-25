import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MobileMenu } from '../../../src/ui/layout/MobileMenu'

afterEach(cleanup)

describe('mobile menu icons', () => {
  it('각 drawer 항목은 숨김 아이콘 다음에 라벨을 표시한다', () => {
    render(<MobileMenu open />)
    for (const label of ['현황', '계좌']) {
      const button = screen.getByRole('button', { name: label })
      expect(button.children[0].tagName.toLowerCase()).toBe('svg')
      expect(button.children[0]).toHaveAttribute('aria-hidden', 'true')
      expect(button.children[0]).toHaveClass('h-4', 'w-4', 'text-current')
      expect(button.children[1]).toHaveTextContent(label)
      expect(button).toHaveClass('gap-2')
      if (label === '계좌') expect(button).toHaveClass('text-stone-900')
    }
  })

  it('메뉴와 닫기 버튼은 숨김 SVG를 쓰고 문자 아이콘은 표시하지 않는다', () => {
    render(<MobileMenu open />)
    for (const [label, text] of [['메뉴', '☰'], ['메뉴 닫기', '×']]) {
      const button = screen.getByRole('button', { name: label })
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(button).not.toHaveTextContent(text)
    }
  })
})
