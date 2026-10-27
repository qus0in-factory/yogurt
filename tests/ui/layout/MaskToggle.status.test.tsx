import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MaskToggle } from '../../../src/ui/layout/MaskToggle'
import { useMaskStore } from '../../../src/ui/state/mask-store'

beforeEach(() => {
  localStorage.clear()
  useMaskStore.setState({ masked: false })
})
afterEach(cleanup)

describe('가리기 토글 상태 표시', () => {
  it('꺼짐과 켜짐에서 활성 스타일이 다르고 글자와 아이콘이 함께 있으며 aria-pressed가 일치한다', () => {
    render(<MaskToggle />)
    const button = screen.getByRole('button', { name: '가리기' })

    // 꺼짐: outline 스타일, Eye 아이콘, aria-pressed false
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveClass('border-primary-200')
    expect(button).not.toHaveClass('bg-primary-300')
    expect(button).toHaveTextContent('가리기')
    expect(button.querySelector('svg')).toBeInTheDocument()
    expect(button.querySelector('svg')).toHaveClass('lucide-eye')

    // 클릭하여 켜짐으로 전환
    fireEvent.click(button)

    // 켜짐: primary 채움 활성 스타일, EyeOff 아이콘, aria-pressed true
    expect(useMaskStore.getState().masked).toBe(true)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveClass('bg-primary-300')
    expect(button).toHaveTextContent('가리기')
    expect(button.querySelector('svg')).toBeInTheDocument()
    expect(button.querySelector('svg')).toHaveClass('lucide-eye-off')

    // 다시 꺼짐으로 전환
    fireEvent.click(button)
    expect(useMaskStore.getState().masked).toBe(false)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveClass('border-primary-200')
    expect(button.querySelector('svg')).toHaveClass('lucide-eye')
  })
})
