import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileMenu } from './MobileMenu'

afterEach(cleanup)

describe('MobileMenu', () => {
  it('열린 메뉴 nav에는 하단 테두리 클래스가 없다', () => {
    render(<MobileMenu open />)
    const nav = screen.getByRole('navigation')
    expect(nav).not.toHaveClass('border-b')
    expect(nav).not.toHaveClass('border-stone-200')
  })

  it('aria-expanded를 토글한다', () => {
    const onToggle = vi.fn()
    render(<MobileMenu open={false} onToggle={onToggle} />)
    const button = screen.getByRole('button', { name: /메뉴/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalled()
  })
})
