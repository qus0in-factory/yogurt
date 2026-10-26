import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { MENU_ITEMS } from '../../../src/ui/layout/menu'
import { typeScale } from '../../../src/ui/styles/type-scale'
import { LayoutDashboard, Wallet } from 'lucide-react'

afterEach(cleanup)

describe('Sidebar', () => {
  it('메뉴는 현황을 계좌 위에 제공한다', () => {
    expect(MENU_ITEMS).toEqual([
      { id: 'overview', label: '현황', icon: LayoutDashboard },
      { id: 'accounts', label: '계좌', icon: Wallet },
    ])
  })
  it('현황과 계좌 버튼을 순서대로 표시한다', () => {
    render(<Sidebar current="overview" onNavigate={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['현황', '계좌'])
    for (const [index, button] of buttons.entries()) {
      expect(button.children[0].tagName.toLowerCase()).toBe('svg')
      expect(button.children[0]).toHaveAttribute('aria-hidden', 'true')
      expect(button.children[0]).toHaveClass('h-4', 'w-4', 'text-current')
      expect(button.children[1]).toHaveTextContent(['현황', '계좌'][index])
      expect(button).toHaveClass('gap-2')
      if (index === 0) expect(button).toHaveClass('text-stone-900')
    }
  })
  it('nav에 접근 가능한 이름을 제공한다', () => {
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    expect(screen.getByRole('navigation')).toHaveAccessibleName()
  })

  it('현재 메뉴에 aria-current="page"를 설정한다', () => {
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: '계좌' })).toHaveAttribute('aria-current', 'page')
  })

  it('메뉴 클릭 시 onNavigate를 호출한다', () => {
    const onNavigate = vi.fn()
    render(<Sidebar current="accounts" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: '계좌' }))
    expect(onNavigate).toHaveBeenCalled()
  })

  it('브랜드 영역에 favicon 이미지와 YOGURT 텍스트를 함께 표시한다', () => {
    const { container } = render(<Sidebar current="accounts" />)
    expect(screen.getByText('YOGURT')).toBeInTheDocument()
    expect(screen.getByText('YOGURT')).toHaveClass(...typeScale.section.split(' '))
    const icon = container.querySelector('img[aria-hidden="true"]')
    expect(icon).toHaveAttribute('src', '/favicon.png')
    expect(icon).toHaveAttribute('alt', '')
  })

  it('메뉴 항목에 읽기 쉬운 내부 여백을 적용한다', () => {
    render(<Sidebar current="accounts" />)
    expect(screen.getByRole('button', { name: '계좌' })).toHaveClass('py-2.5', 'px-3')
  })
})
