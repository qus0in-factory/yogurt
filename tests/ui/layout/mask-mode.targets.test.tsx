// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '../../../src/app/auth/client'
import { App } from '../../../src/ui/App'
import { Sensitive } from '../../../src/ui/components/Sensitive'
import { useMaskStore } from '../../../src/ui/state/mask-store'

vi.mock('idb-keyval', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(async () => {}) }))
vi.mock('../../../src/app/auth/client', () => ({ checkSession: vi.fn(async () => true), logout: vi.fn() }))

describe('가리기 대상 및 헤더 위치 검증', () => {
  beforeEach(() => { useMaskStore.setState({ masked: false }) })
  afterEach(cleanup)

  it('헤더에서 가리기 토글과 로그아웃 버튼이 같은 컨테이너에 있고 토글 시 블러가 적용된다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><App /></QueryClientProvider>)
    const maskBtn = await screen.findByRole('button', { name: '가리기' })
    const logoutBtn = screen.getByRole('button', { name: '로그아웃' })
    expect(maskBtn.parentElement).toBe(logoutBtn.parentElement)
    expect(maskBtn.parentElement).toHaveClass('ml-auto', 'flex', 'items-center', 'gap-2')
    expect(maskBtn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(maskBtn)
    expect(maskBtn).toHaveAttribute('aria-pressed', 'true')
    expect(useMaskStore.getState().masked).toBe(true)
  })

  it('소유자, 계좌번호, 금액, 날짜, 수량은 블러되고 별칭, 입력칸, 비율, 연차, 라벨은 유지된다', () => {
    useMaskStore.setState({ masked: true })
    render(
      <div>
        <label htmlFor="owner-input">소유자 라벨</label>
        <input id="owner-input" defaultValue="직접입력" />
        <Sensitive as="span">홍길동</Sensitive>
        <span>급여통장</span>
        <Sensitive as="span">12345678</Sensitive>
        <Sensitive as="span">50,000원</Sensitive>
        <Sensitive as="span">3,000만</Sensitive>
        <Sensitive as="span">2026.10.26</Sensitive>
        <Sensitive as="span">42</Sensitive>
        <span>12.5%</span>
        <span>2년차</span>
      </div>,
    )
    expect(screen.getByText('홍길동')).toHaveClass('blur-[6px]')
    expect(screen.getByText('12345678')).toHaveClass('blur-[6px]')
    expect(screen.getByText('50,000원')).toHaveClass('blur-[6px]')
    expect(screen.getByText('3,000만')).toHaveClass('blur-[6px]')
    expect(screen.getByText('2026.10.26')).toHaveClass('blur-[6px]')
    expect(screen.getByText('42')).toHaveClass('blur-[6px]')
    expect(screen.getByText('급여통장')).not.toHaveClass('blur-[6px]')
    expect(screen.getByLabelText('소유자 라벨')).not.toHaveClass('blur-[6px]')
    expect(screen.getByText('소유자 라벨')).not.toHaveClass('blur-[6px]')
    expect(screen.getByText('12.5%')).not.toHaveClass('blur-[6px]')
    expect(screen.getByText('2년차')).not.toHaveClass('blur-[6px]')
  })

  it('계좌번호(별칭) 혼합 표시에서 번호만 블러되고 괄호와 별칭은 유지된다', () => {
    useMaskStore.setState({ masked: true })
    render(<table><tbody><tr><td><Sensitive>12345678</Sensitive><span>(주계좌)</span></td></tr></tbody></table>)
    expect(screen.getByText('12345678')).toHaveClass('blur-[6px]')
    expect(screen.getByText('(주계좌)')).not.toHaveClass('blur-[6px]')
  })
})
