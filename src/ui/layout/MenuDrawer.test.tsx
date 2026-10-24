import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MobileMenu } from './MobileMenu'

afterEach(cleanup)

describe('mobile menu icons', () => {
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
