import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Carousel } from '../../../src/ui/components/Carousel'
import { typeScale } from '../../../src/ui/styles/type-scale'

const listeners = new Set<(event: MediaQueryListEvent) => void>()
const labels = { list: '계좌 목록', previous: '이전', next: '다음',
  goTo: (page: number) => `${page}페이지로 이동`, position: (page: number, total: number) => `${page} / ${total}` }
function show(count = 3, list = labels.list) {
  return render(<Carousel items={Array.from({ length: count }, (_, index) => index)}
    labels={{ ...labels, list }} renderItem={item => <p key={item}>계좌{item + 1}</p>} />)
}
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  }))
})
afterEach(() => { cleanup(); listeners.clear(); vi.unstubAllGlobals() })
it.each(['계좌 목록', 'IRP 계좌 목록'])('%s의 칩과 점을 같은 행에 중앙 정렬한다', list => {
  show(3, list)
  const chip = screen.getByRole('status')
  expect(chip).toHaveTextContent('1 / 3')
  expect(chip).toHaveClass('rounded-full', 'bg-stone-100', 'px-2.5', 'py-0.5', 'tabular-nums', ...typeScale.caption.split(' '))
  expect(chip).toHaveAttribute('aria-live', 'polite')
  expect(chip).toHaveAttribute('aria-label', '3페이지 중 1페이지')
  expect(chip.parentElement).toHaveClass('flex', 'items-center', 'gap-2')
  expect(screen.getByRole('button', { name: '1페이지로 이동' }).parentElement).toBe(chip.parentElement)
})
it('페이지 이동 시 칩과 읽기용 설명을 갱신하고 경계 화살표를 비활성화한다', () => {
  show()
  expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '다음' }))
  expect(screen.getByRole('status')).toHaveTextContent('2 / 3')
  expect(screen.getByRole('status')).toHaveAttribute('aria-label', '3페이지 중 2페이지')
  fireEvent.click(screen.getByRole('button', { name: '3페이지로 이동' }))
  expect(screen.getByRole('status')).toHaveTextContent('3 / 3')
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
})
it.each([0, 1])('항목 %i개로 한 페이지 이하이면 칩·점·화살표를 숨긴다', count => {
  show(count)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.queryAllByRole('button')).toHaveLength(0)
})
it('화면 확대로 세 항목이 한 페이지에 들어가면 인디케이터 전체를 숨긴다', () => {
  show()
  expect(screen.getByRole('status')).toBeInTheDocument()
  act(() => listeners.forEach(listener => listener({ matches: true } as MediaQueryListEvent)))
  expect(screen.getByText('계좌3')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.queryAllByRole('button')).toHaveLength(0)
})
