import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { MENU_ITEMS } from '../../../src/ui/layout/menu'
import { typeScale } from '../../../src/ui/styles/type-scale'
import { LayoutDashboard, SlidersHorizontal, Wallet } from 'lucide-react'

afterEach(cleanup)

describe('Sidebar', () => {
  it('메뉴는 현황과 운용을 계좌 위에 제공한다', () => {
    expect(MENU_ITEMS).toEqual([
      { id: 'overview', label: '현황', icon: LayoutDashboard },
      { id: 'operations', label: '운용', icon: SlidersHorizontal },
      { id: 'accounts', label: '계좌', icon: Wallet },
    ])
  })

  it('현황·운용·계좌 메인 버튼과 하위 항목(포트폴리오·리밸런싱)을 표시한다', () => {
    render(<Sidebar current="overview" onNavigate={vi.fn()} />)
    const labels = ['현황', '운용', '계좌']
    for (const [index, label] of labels.entries()) {
      const button = screen.getByRole('button', { name: label })
      expect(button.children[0].tagName.toLowerCase()).toBe('svg')
      expect(button.children[0]).toHaveAttribute('aria-hidden', 'true')
      expect(button.children[0]).toHaveClass('h-4', 'w-4', 'text-current')
      expect(button.children[1]).toHaveTextContent(label)
      if (index === 0) expect(button).toHaveClass('text-stone-900')
    }
    expect(screen.getByRole('button', { name: '포트폴리오' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '리밸런싱' })).toBeInTheDocument()
  })

  it('하위 항목 클릭 시 onNavigate를 호출한다', () => {
    const onNavigate = vi.fn()
    render(<Sidebar current="accounts" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: '포트폴리오' }))
    expect(onNavigate).toHaveBeenCalledWith('operations')
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
    expect(onNavigate).toHaveBeenCalledWith('accounts')
  })

  it('브랜드 영역에 favicon 이미지와 YOGURT 텍스트를 함께 표시한다', () => {
    const { container } = render(<Sidebar current="accounts" />)
    expect(screen.getByText('YOGURT')).toHaveClass(...typeScale.section.split(' '))
    expect(container.querySelector('img[aria-hidden="true"]')).toHaveAttribute('src', '/favicon.png')
  })

  it('메뉴 항목에 읽기 쉬운 내부 여백을 적용한다', () => {
    render(<Sidebar current="accounts" />)
    expect(screen.getByRole('button', { name: '계좌' })).toHaveClass('py-2.5', 'px-3')
  })
})
