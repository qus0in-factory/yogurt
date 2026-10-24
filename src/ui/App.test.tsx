import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../app/auth/client'
import { App } from './App'

afterEach(cleanup)

describe('App', () => {
  it('세션 401(미인증)이면 로그인 화면을 표시한다', async () => {
    vi.spyOn(auth, 'checkSession').mockResolvedValueOnce(false)
    render(<App />)
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('세션 200(인증)이면 대시보드 셸을 표시한다', async () => {
    vi.spyOn(auth, 'checkSession').mockResolvedValueOnce(true)
    render(<App />)
    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()
  })

  it('메뉴 전환 및 aria-current를 지원한다', async () => {
    vi.spyOn(auth, 'checkSession').mockResolvedValueOnce(true)
    render(<App />)
    await screen.findByRole('heading', { name: '대시보드' })
    const accBtn = screen.getByRole('button', { name: '계좌/자산' })
    fireEvent.click(accBtn)
    expect(screen.getByRole('heading', { name: '계좌/자산' })).toBeInTheDocument()
    const txBtn = screen.getByRole('button', { name: '거래' })
    fireEvent.click(txBtn)
    expect(txBtn).toHaveAttribute('aria-current', 'page')
  })

  it('로그인 성공 시 셸로 전환되고, 로그아웃 시 로그인 화면으로 돌아간다', async () => {
    vi.spyOn(auth, 'checkSession').mockResolvedValueOnce(false)
    vi.spyOn(auth, 'login').mockResolvedValueOnce(true)
    vi.spyOn(auth, 'logout').mockResolvedValueOnce()
    render(<App />)
    await screen.findByRole('heading', { name: '로그인' })

    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('모바일 메뉴 버튼과 네비게이션 접근성을 유지한다', async () => {
    vi.spyOn(auth, 'checkSession').mockResolvedValueOnce(true)
    render(<App />)
    const button = await screen.findByRole('button', { name: /메뉴/ })
    expect(screen.getByRole('navigation')).toHaveAccessibleName()
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})
