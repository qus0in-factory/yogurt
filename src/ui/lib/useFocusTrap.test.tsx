import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRef, useState } from 'react'
import { useFocusTrap } from './useFocusTrap'

function Harness() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(true)
  useFocusTrap(ref, open)
  return (
    <div>
      <button onClick={() => setOpen(false)}>외부</button>
      <div ref={ref} tabIndex={-1}>
        <button>첫번째</button>
        <button>두번째</button>
      </div>
    </div>
  )
}

afterEach(cleanup)

describe('useFocusTrap', () => {
  it('열릴 때 컨테이너 내부 첫 포커스 가능 요소에 포커스한다', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus()
  })

  it('닫힐 때 이전 포커스 요소로 복귀한다', () => {
    const trigger = document.createElement('button')
    trigger.textContent = '트리거'
    document.body.appendChild(trigger)
    trigger.focus()

    function Harness2() {
      const ref = useRef<HTMLDivElement>(null)
      const [open, setOpen] = useState(true)
      useFocusTrap(ref, open)
      return (
        <div>
          <button onClick={() => setOpen(false)}>닫기</button>
          <div ref={ref} tabIndex={-1}>
            <button>내부</button>
          </div>
        </div>
      )
    }

    const { unmount } = render(<Harness2 />)
    unmount()
    expect(trigger).toHaveFocus()
    document.body.removeChild(trigger)
  })

  it('Tab 키가 컨테이너 밖으로 나가지 않는다', () => {
    render(<Harness />)
    const last = screen.getByRole('button', { name: '두번째' })
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus()
  })
})
