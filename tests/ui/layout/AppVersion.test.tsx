import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import packageJson from '../../../package.json'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { MenuDrawer } from '../../../src/ui/layout/MenuDrawer'
import { AppVersion } from '../../../src/ui/layout/AppVersion'
import { typeScale } from '../../../src/ui/styles/type-scale'

afterEach(cleanup)
it('주입된 현재 semver를 v 접두사와 공통 캡션 스타일로 표시한다', () => {
  expect(import.meta.env.VITE_APP_VERSION).toBe(packageJson.version)
  render(<AppVersion />)
  expect(screen.getByText(`v${packageJson.version}`)).toHaveClass(
    ...typeScale.caption.split(' '), 'tabular-nums', 'px-3', 'py-3', 'mt-auto',
  )
})
it.each([
  ['사이드바', () => <Sidebar current="accounts" />, 'md:flex-col'],
  ['모바일 드로어', () => <MenuDrawer open current="accounts" onNavigate={vi.fn()} onClose={vi.fn()} />, 'flex-col'],
] as const)('%s는 메뉴 목록 다음 맨 하단에 현재 버전을 배치한다', (_name, menu, direction) => {
  render(menu())
  const version = screen.getByText(`v${import.meta.env.VITE_APP_VERSION}`)
  const navigation = screen.getByRole('navigation', { name: '주 메뉴' })
  expect(navigation.compareDocumentPosition(version) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(version.parentElement?.lastElementChild).toBe(version)
  expect(version.parentElement).toHaveClass(direction)
  expect(version).toHaveClass('mt-auto', 'px-3', 'py-3', 'tabular-nums')
})
