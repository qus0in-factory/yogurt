// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sensitive } from '../../../src/ui/components/Sensitive'
import { MaskToggle } from '../../../src/ui/layout/MaskToggle'
import { clearClientStorage } from '../../../src/ui/state/clear-client-storage'
import { MASK_MODE_STORAGE_KEY, useMaskStore } from '../../../src/ui/state/mask-store'

vi.mock('idb-keyval', () => ({ del: vi.fn(), get: vi.fn(), set: vi.fn() }))

describe('가리기 모드 (Mask Mode)', () => {
  beforeEach(() => {
    localStorage.clear()
    useMaskStore.setState({ masked: false })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('토글 버튼이 aria-pressed 상태를 변경하고 아이콘/라벨을 제공한다', () => {
    render(<MaskToggle />)
    const toggle = screen.getByRole('button', { name: '가리기' })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(useMaskStore.getState().masked).toBe(true)

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(useMaskStore.getState().masked).toBe(false)
  })

  it('가리기가 켜지면 Sensitive 요소에 블러와 반투명 클래스가 붙고 끄면 사라진다', () => {
    const { rerender } = render(<div><Sensitive>1,000,000원</Sensitive><span data-testid="ratio">15.00%</span></div>)
    const sensitiveEl = screen.getByText('1,000,000원')
    const ratioEl = screen.getByTestId('ratio')

    expect(sensitiveEl).not.toHaveClass('blur-[6px]')
    expect(sensitiveEl).not.toHaveClass('opacity-60')
    expect(ratioEl).not.toHaveClass('blur-[6px]')

    act(() => { useMaskStore.getState().setMasked(true) })
    rerender(<div><Sensitive>1,000,000원</Sensitive><span data-testid="ratio">15.00%</span></div>)

    expect(sensitiveEl).toHaveClass('blur-[6px]')
    expect(sensitiveEl).toHaveClass('opacity-60')
    expect(ratioEl).not.toHaveClass('blur-[6px]')
    expect(sensitiveEl).not.toHaveAttribute('aria-hidden')
  })

  it('localStorage의 저장값이 다음 렌더 시 복원된다', () => {
    localStorage.setItem(MASK_MODE_STORAGE_KEY, JSON.stringify({ state: { masked: true }, version: 0 }))
    useMaskStore.persist.rehydrate()

    expect(useMaskStore.getState().masked).toBe(true)
    render(<MaskToggle />)
    expect(screen.getByRole('button', { name: '가리기' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clearClientStorage 호출 시에도 yogurt:mask-mode 는 삭제되지 않는다', async () => {
    localStorage.setItem(MASK_MODE_STORAGE_KEY, JSON.stringify({ state: { masked: true }, version: 0 }))
    localStorage.setItem('yogurt:ui', 'delete-me')

    await clearClientStorage(false)

    expect(localStorage.getItem(MASK_MODE_STORAGE_KEY)).not.toBeNull()
    expect(localStorage.getItem('yogurt:ui')).toBeNull()
  })
})
