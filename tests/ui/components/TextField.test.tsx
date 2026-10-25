import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TextField } from '../../../src/ui/components/TextField'
import { typeScale } from '../../../src/ui/styles/type-scale'

afterEach(cleanup)

describe('TextField', () => {
  it('label과 input이 연결된다', () => {
    render(<TextField label="이름" name="name" value="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByText('이름')).toHaveClass(...typeScale.label.split(' '))
  })

  it('입력하면 onChange에 값이 전달된다', () => {
    const onChange = vi.fn()
    render(<TextField label="이름" name="name" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    expect(onChange).toHaveBeenCalledWith('홍길동')
  })

  it('error가 있으면 aria-invalid와 오류 문구가 연결된다', () => {
    render(<TextField label="이름" name="name" value="" onChange={vi.fn()} error="필수 입력" />)
    const input = screen.getByLabelText('이름')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(screen.getByText('필수 입력')).toHaveAttribute('id', describedBy as string)
  })

  it('maxLength·inputMode·pattern·placeholder·list·autoComplete를 input에 전달한다', () => {
    render(<TextField label="계좌번호" name="accountNumber" value="" onChange={vi.fn()} maxLength={8} inputMode="numeric" pattern="[0-9]{8}" placeholder="12345678" list="owners" autoComplete="off" />)
    const input = screen.getByLabelText('계좌번호')
    expect(input).toHaveAttribute('maxLength', '8')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]{8}')
    expect(input).toHaveAttribute('placeholder', '12345678')
    expect(input).toHaveAttribute('list', 'owners')
    expect(input).toHaveAttribute('autocomplete', 'off')
  })
})
