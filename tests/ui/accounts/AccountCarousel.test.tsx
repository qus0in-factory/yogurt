import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AccountCarousel } from '../../../src/ui/accounts/AccountCarousel'
import { useUiStore } from '../../../src/ui/state/ui-store'
const accounts = Array.from({ length: 6 }, (_, i) => ({ id: String(i), alias: `계좌${i + 1}`, owner: '소유자', accountNumber: '1234', products: ['01'], productPlans: {}, createdAt: '' }))
const listeners = new Set<(event: MediaQueryListEvent) => void>()
const animate = vi.fn()
let wide = false
let reduced = false
beforeEach(() => {
  sessionStorage.clear()
  wide = false
  reduced = false
  animate.mockClear()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: (query.includes('768') || query.includes('769')) ? wide : reduced,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  }))
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate })
})
afterEach(() => { cleanup(); listeners.clear(); vi.unstubAllGlobals() })
const show = (items = accounts) => render(<QueryClientProvider client={new QueryClient()}><AccountCarousel accounts={items} onEdit={vi.fn()} /></QueryClientProvider>)
it('모바일 다음·이전과 경계 disabled는 페이지 단위다', () => {
  show()
  expect(screen.getAllByRole('group')).toHaveLength(1)
  expect(screen.getByRole('button', { name: '이전 계좌' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '다음 계좌' }))
  expect(screen.getByText('2 / 6')).toBeInTheDocument()
  expect(screen.getByRole('group', { name: '계좌2' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '6번째 페이지로 이동' }))
  expect(screen.getByRole('button', { name: '다음 계좌' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '이전 계좌' }))
  expect(screen.getByText('5 / 6')).toBeInTheDocument()
})
it('데스크톱은 3장이고 크기 변경 후 기존 첫 카드가 보인다', () => {
  wide = true
  show()
  expect(screen.getAllByRole('group')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: '다음 계좌' }))
  expect(screen.getByText('2 / 2')).toBeInTheDocument()
  act(() => listeners.forEach(listener => listener({ matches: false } as MediaQueryListEvent)))
  expect(screen.getByText('4 / 6')).toBeInTheDocument()
  expect(screen.getByRole('group', { name: '계좌4' })).toBeInTheDocument()
})
it('한 페이지면 화살표가 없고 좌우 키·점으로 이동한다', () => {
  const view = show(accounts.slice(0, 1))
  expect(screen.queryByRole('button', { name: '다음 계좌' })).not.toBeInTheDocument()
  view.unmount()
  show()
  fireEvent.keyDown(screen.getByLabelText('계좌 목록'), { key: 'ArrowRight' })
  expect(screen.getByText('2 / 6')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByLabelText('계좌 목록'), { key: 'ArrowLeft' })
  expect(screen.getByText('1 / 6')).toBeInTheDocument()
})
it('페이지 저장·복원과 선택, 기존 키 제거를 처리한다', () => {
  sessionStorage.setItem('yogurt:accounts-page', '1')
  sessionStorage.setItem('yogurt:accounts-index', '9')
  show()
  expect(screen.getByText('2 / 6')).toBeInTheDocument()
  expect(useUiStore.getState().selectedAccountId).toBe('1')
  expect(sessionStorage.getItem('yogurt:accounts-index')).toBeNull()
})
it('스와이프 50px 미만은 유지하고 50px 이상이면 넘긴다', () => {
  show()
  const region = screen.getByLabelText('계좌 목록')
  fireEvent.touchStart(region, { touches: [{ clientX: 100 }] })
  fireEvent.touchEnd(region, { changedTouches: [{ clientX: 51 }] })
  expect(screen.getByText('1 / 6')).toBeInTheDocument()
  fireEvent.touchStart(region, { touches: [{ clientX: 100 }] })
  fireEvent.touchEnd(region, { changedTouches: [{ clientX: 50 }] })
  expect(screen.getByText('2 / 6')).toBeInTheDocument()
})
it('모션 감소 설정이면 전환 애니메이션이 없다', () => {
  reduced = true
  show()
  expect(animate).not.toHaveBeenCalled()
})
