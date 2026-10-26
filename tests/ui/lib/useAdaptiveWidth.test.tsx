import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { classifyWidth, useAdaptiveWidth } from '../../../src/ui/lib/useAdaptiveWidth'

const listeners = new Set<() => void>()

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
}
function stubMatchMedia() {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }))
}
function Probe() {
  return <p>{useAdaptiveWidth()}</p>
}
afterEach(() => { cleanup(); listeners.clear(); vi.unstubAllGlobals() })

it.each([
  [375, 'small'], [376, 'mobile'], [768, 'mobile'], [769, 'desktop'], [1024, 'desktop'],
] as const)('classifyWidth(%i)은 %s를 반환한다', (width, expected) => {
  expect(classifyWidth(width)).toBe(expected)
})

it('resize 시 폭 분류를 갱신하고 언마운트 시 리스너를 제거한다', () => {
  stubMatchMedia()
  setWidth(375)
  const view = render(<Probe />)
  expect(screen.getByText('small')).toBeInTheDocument()
  setWidth(500)
  act(() => { window.dispatchEvent(new Event('resize')) })
  expect(screen.getByText('mobile')).toBeInTheDocument()
  setWidth(1024)
  act(() => { window.dispatchEvent(new Event('resize')) })
  expect(screen.getByText('desktop')).toBeInTheDocument()
  expect(listeners.size).toBeGreaterThan(0)
  view.unmount()
  expect(listeners.size).toBe(0)
})

it('matchMedia가 함수가 아니면 mobile을 반환한다', () => {
  vi.stubGlobal('matchMedia', undefined)
  setWidth(1024)
  render(<Probe />)
  expect(screen.getByText('mobile')).toBeInTheDocument()
})
