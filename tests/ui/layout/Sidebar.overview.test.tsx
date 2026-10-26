import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from '../../../src/ui/layout/Sidebar'
import { useUiStore } from '../../../src/ui/state/ui-store'

afterEach(cleanup)

describe('Sidebar 현황 하위 메뉴', () => {
  beforeEach(() => {
    useUiStore.setState({ overviewTab: 'isa' })
  })

  it('현황 아래에 ISA, 연금저축, IRP 하위 항목을 표시한다', () => {
    render(<Sidebar current="overview" />)
    expect(screen.getByRole('button', { name: 'ISA' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '연금저축' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'IRP' })).toBeInTheDocument()
  })

  it('하위 항목 클릭 시 setOverviewTab과 onNavigate를 호출한다', () => {
    const onNavigate = vi.fn()
    render(<Sidebar current="accounts" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: '연금저축' }))
    expect(onNavigate).toHaveBeenCalledWith('overview')
    expect(useUiStore.getState().overviewTab).toBe('pension')
  })

  it('현재 overviewTab에 aria-current="page"를 설정하고 탭 변경 시 동기화된다', () => {
    const { rerender } = render(<Sidebar current="overview" />)
    expect(screen.getByRole('button', { name: 'ISA' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '연금저축' })).not.toHaveAttribute('aria-current')

    act(() => {
      useUiStore.setState({ overviewTab: 'pension' })
    })
    rerender(<Sidebar current="overview" />)
    expect(screen.getByRole('button', { name: '연금저축' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'ISA' })).not.toHaveAttribute('aria-current')
  })
})
