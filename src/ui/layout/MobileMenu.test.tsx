import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileMenu } from './MobileMenu'
afterEach(cleanup)
const openMenu = () => fireEvent.click(screen.getByRole('button', { name: '메뉴' }))
describe('MobileMenu', () => {
  it('메뉴 버튼이 aria-expanded를 토글한다', () => {
    render(<MobileMenu />)
    const button = screen.getByRole('button', { name: '메뉴' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
  it('버튼을 누르면 메뉴 dialog가 열린다', () => {
    render(<MobileMenu />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    openMenu()
    const dialog = screen.getByRole('dialog', { name: '메뉴' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('navigation', { name: '주 메뉴' })).toBeInTheDocument()
  })
  it('drawer 상단에 favicon 브랜드가 표시된다', () => {
    render(<MobileMenu />)
    openMenu()
    const dialog = screen.getByRole('dialog', { name: '메뉴' })
    expect(dialog.querySelector('img[src="/favicon.png"]')).toBeInTheDocument()
    expect(screen.getByText('YOGURT')).toBeInTheDocument()
  })
  it('배경 클릭 시 닫힌다', () => {
    render(<MobileMenu />)
    openMenu()
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement
    fireEvent.click(backdrop)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('닫기 버튼을 누르면 닫힌다', () => {
    render(<MobileMenu />)
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('Escape 키로 닫힌다', () => {
    render(<MobileMenu />)
    openMenu()
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('메뉴 항목을 선택하면 onNavigate를 호출하고 닫힌다', () => {
    const onNavigate = vi.fn()
    render(<MobileMenu onNavigate={onNavigate} />)
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: '계좌' }))
    expect(onNavigate).toHaveBeenCalledWith('accounts')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
describe('MobileMenu drawer focus', () => {
  it('drawer 열림 시 패널 내부로 포커스 이동', () => {
    render(<MobileMenu />)
    openMenu()
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toHaveFocus()
  })
  it('닫힘 후 햄버거 버튼으로 포커스 복귀', () => {
    render(<MobileMenu />)
    const hamburger = screen.getByRole('button', { name: '메뉴' })
    hamburger.focus()
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))
    expect(hamburger).toHaveFocus()
  })
  it('Tab 트랩으로 포커스가 패널 밖으로 나가지 않는다', () => {
    render(<MobileMenu />)
    openMenu()
    screen.getByRole('button', { name: '계좌' }).focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toHaveFocus()
  })
})
