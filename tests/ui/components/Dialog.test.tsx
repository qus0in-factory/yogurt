import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dialog } from '../../../src/ui/components/Dialog'

afterEach(cleanup)

describe('Dialog', () => {
  it('open이 false이면 렌더링하지 않는다', () => {
    render(<Dialog open={false} onClose={vi.fn()} title="제목">내용</Dialog>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('open이 true이면 dialog와 제목을 렌더링한다', () => {
    render(<Dialog open onClose={vi.fn()} title="제목">내용</Dialog>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('제목')).toBeInTheDocument()
  })

  it('Escape 키를 누르면 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Dialog open onClose={onClose} title="제목">내용</Dialog>)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('배경을 클릭하면 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Dialog open onClose={onClose} title="제목">내용</Dialog>)
    fireEvent.click(screen.getByTestId('dialog-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('열릴 때 첫 포커스 가능 요소에 포커스한다', () => {
    render(<Dialog open onClose={vi.fn()} title="제목"><button>확인</button></Dialog>)
    expect(screen.getByRole('button', { name: '확인' })).toHaveFocus()
  })

  it('닫힐 때 이전 포커스 요소로 복귀한다', () => {
    const trigger = document.createElement('button')
    trigger.textContent = '열기'
    document.body.appendChild(trigger)
    trigger.focus()

    const { rerender } = render(<Dialog open onClose={vi.fn()} title="제목">내용</Dialog>)
    rerender(<Dialog open={false} onClose={vi.fn()} title="제목">내용</Dialog>)
    expect(trigger).toHaveFocus()
    document.body.removeChild(trigger)
  })

  it('Tab 키가 패널 밖으로 나가지 않는다', () => {
    render(<Dialog open onClose={vi.fn()} title="제목"><button>확인</button></Dialog>)
    const button = screen.getByRole('button', { name: '확인' })
    button.focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(button).toHaveFocus()
  })

  it('본문 영역만 스크롤되고 모바일 바텀시트·데스크톱 중앙 배치를 적용한다', () => {
    render(<Dialog open onClose={vi.fn()} title="제목">내용</Dialog>)
    expect(screen.getByTestId('dialog-body')).toHaveClass('flex-1', 'overflow-y-auto', 'overscroll-contain')
    expect(screen.getByTestId('dialog-backdrop')).toHaveClass('items-end', 'p-0', 'md:items-center', 'md:p-4')
    expect(screen.getByRole('dialog')).toHaveClass('flex', 'flex-col', 'max-h-[90dvh]', 'md:max-h-[calc(100dvh-2rem)]', 'rounded-t-2xl')
  })

  it('열린 동안 body 스크롤을 잠그고 닫히면 원래 값으로 복원한다', () => {
    document.body.style.overflow = 'auto'
    const { rerender } = render(<Dialog open onClose={vi.fn()} title="제목">내용</Dialog>)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Dialog open={false} onClose={vi.fn()} title="제목">내용</Dialog>)
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })
})
