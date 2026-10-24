import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'

afterEach(cleanup)

describe('Sidebar', () => {
  it('nav에 접근 가능한 이름을 제공한다', () => {
    render(<Sidebar current="dashboard" onNavigate={vi.fn()} />)
    expect(screen.getByRole('navigation')).toHaveAccessibleName()
  })

  it('현재 메뉴에 aria-current="page"를 설정한다', () => {
    render(<Sidebar current="accounts" onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: '계좌/자산' })).toHaveAttribute('aria-current', 'page')
  })

  it('메뉴 클릭 시 onNavigate를 호출한다', () => {
    const onNavigate = vi.fn()
    render(<Sidebar current="dashboard" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: '거래' }))
    expect(onNavigate).toHaveBeenCalled()
  })

  it('브랜드 아이콘과 YOGURT 텍스트를 함께 표시한다', () => {
    const { container } = render(<Sidebar current="dashboard" />)
    expect(screen.getByText('YOGURT')).toBeInTheDocument()
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
  })
})
