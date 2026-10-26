import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileMenu } from '../../../src/ui/layout/MobileMenu'
import { useUiStore } from '../../../src/ui/state/ui-store'

afterEach(cleanup)

describe('mobile menu icons', () => {
  it('각 drawer 항목은 숨김 아이콘 다음에 라벨을 표시한다', () => {
    render(<MobileMenu open />)
    for (const label of ['현황', '운용', '계좌']) {
      const button = screen.getByRole('button', { name: label })
      expect(button.children[0].tagName.toLowerCase()).toBe('svg')
      expect(button.children[0]).toHaveAttribute('aria-hidden', 'true')
      expect(button.children[0]).toHaveClass('h-4', 'w-4', 'text-current')
      expect(button.children[1]).toHaveTextContent(label)
      expect(button).toHaveClass('gap-2')
      if (label === '계좌') expect(button).toHaveClass('text-stone-900')
    }
  })

  it('현황과 운용 아래에 각각 하위 탭 항목을 표시하고 클릭 시 동작한다', () => {
    const onNavigate = vi.fn()
    render(<MobileMenu open onNavigate={onNavigate} />)
    expect(screen.getByRole('button', { name: 'ISA' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '연금저축' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'IRP' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '포트폴리오' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '리밸런싱' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'IRP' }))
    expect(onNavigate).toHaveBeenCalledWith('overview')
    expect(useUiStore.getState().overviewTab).toBe('irp')
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
