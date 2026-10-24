import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useBodyScrollLock } from '../../../src/ui/lib/useBodyScrollLock'

function Harness({ open }: { open: boolean }) {
  useBodyScrollLock(open)
  return null
}

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
})

describe('useBodyScrollLock', () => {
  it('열리면 body 스크롤을 잠그고 닫히면 원래 값으로 복원한다', () => {
    document.body.style.overflow = 'scroll'
    const { rerender } = render(<Harness open />)
    expect(document.body.style.overflow).toBe('hidden')
    rerender(<Harness open={false} />)
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('open이 false면 body 스타일을 바꾸지 않는다', () => {
    render(<Harness open={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('열린 채 unmount되어도 원래 값으로 복원한다', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = render(<Harness open />)
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})
