import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import { MENU_ITEMS } from './menu'

afterEach(cleanup)

describe('Sidebar', () => {
  it('메뉴는 계좌 하나만 제공한다', () => {
    expect(MENU_ITEMS).toEqual([{ id: 'accounts', label: '계좌' }])
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
    const icon = container.querySelector('img[aria-hidden="true"]')
    expect(icon).toHaveAttribute('src', '/favicon.png')
    expect(icon).toHaveAttribute('alt', '')
  })
})
