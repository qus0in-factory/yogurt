import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

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

  it('전달한 className을 기본 스타일과 병합한다', () => {
    render(<Button className="mt-4">추가</Button>)
    expect(screen.getByRole('button', { name: '추가' })).toHaveClass('mt-4')
  })
})
