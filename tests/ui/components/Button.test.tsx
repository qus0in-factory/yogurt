import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from '../../../src/ui/components/Button'

afterEach(cleanup)

describe('Button', () => {
  it('children을 버튼 텍스트로 렌더링하고 기본 type은 button이다', () => {
    render(<Button>저장</Button>)
    const button = screen.getByRole('button', { name: '저장' })
    expect(button).toHaveAttribute('type', 'button')
  })

  it('클릭하면 onClick을 호출한다', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>이동</Button>)
    fireEvent.click(screen.getByRole('button', { name: '이동' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('disabled이면 클릭해도 onClick을 호출하지 않는다', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>이동</Button>)
    fireEvent.click(screen.getByRole('button', { name: '이동' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('default variant는 살구톤 배경과 짙은 글자를 쓴다', () => {
    render(<Button>저장</Button>)
    const button = screen.getByRole('button', { name: '저장' })
    expect(button).toHaveClass('bg-primary-300', 'text-stone-900', 'hover:bg-primary-400')
  })

  it('아이콘과 텍스트 사이에 기본 간격을 둔다', () => {
    render(<Button>삭제</Button>)
    expect(screen.getByRole('button', { name: '삭제' })).toHaveClass('gap-2')
  })

  it('전달한 className을 기본 스타일과 병합한다', () => {
    render(<Button className="mt-4">추가</Button>)
    expect(screen.getByRole('button', { name: '추가' })).toHaveClass('mt-4')
  })
})
