import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InfoTooltip } from '../../../src/ui/components/InfoTooltip'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function show() {
  render(<InfoTooltip label="담보비율 기준">툴팁 내용</InfoTooltip>)
  return screen.getByRole('button', { name: '담보비율 기준' })
}

describe('InfoTooltip', () => {
  it('데스크톱 폭(769px+)에서 hover하면 말풍선 툴팁을 표시한다', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('769'), addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const button = show()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(button)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('툴팁 내용')
    expect(tooltip).toHaveClass('absolute', 'w-56')
    expect(button).toHaveAttribute('aria-describedby', tooltip.id)
  })

  it('focus하면 툴팁을 표시하고 Esc로 닫히며 포커스가 트리거로 돌아간다', () => {
    const button = show()
    button.focus()
    fireEvent.focus(button)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(button)
  })

  it('모바일 폭(768px 이하)에서 시트 형태로 열리고 닫기 버튼과 배경 탭으로 닫힌다', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const button = show()
    fireEvent.click(button)
    expect(screen.getByRole('tooltip')).toHaveClass('fixed', 'bottom-0')
    const closeBtn = screen.getByRole('button', { name: '닫기' })
    expect(closeBtn).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    fireEvent.click(closeBtn)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.click(button)
    fireEvent.click(screen.getByTestId('tooltip-backdrop'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('터치 타깃이 최소 44px 이상이다', () => {
    expect(show()).toHaveClass('min-h-[44px]', 'min-w-[44px]')
  })

  const mockRect = (bLeft: number, rLeft: number) => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true })
    const { container } = render(<InfoTooltip label="도움말">내용</InfoTooltip>)
    const button = screen.getByRole('button', { name: '도움말' })
    const root = container.firstElementChild as HTMLElement
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: bLeft, top: 100, width: 20, height: 20, right: bLeft + 20, bottom: 120, x: bLeft, y: 100, toJSON: () => {} })
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: rLeft, top: 112, width: 20, height: 20, right: rLeft + 20, bottom: 132, x: rLeft, y: 112, toJSON: () => {} })
    fireEvent.mouseEnter(button)
    return screen.getByRole('tooltip').style.left
  }

  it('데스크톱에서 화면 왼쪽 가장자리 근처일 때 root 기준으로 위치가 보정된다', () => {
    expect(mockRect(10, 22)).toBe('98px')
  })

  it('데스크톱에서 화면 오른쪽 가장자리 근처일 때 root 기준으로 위치가 보정된다', () => {
    expect(mockRect(980, 992)).toBe('-112px')
  })
})
