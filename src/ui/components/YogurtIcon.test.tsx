import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { YogurtIcon } from './YogurtIcon'

afterEach(cleanup)

describe('YogurtIcon', () => {
  it('aria-hidden 장식용 svg를 렌더한다', () => {
    const { container } = render(<YogurtIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('fill', 'currentColor')
  })

  it('1~3개의 fill path만 사용한다', () => {
    const { container } = render(<YogurtIcon />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(1)
    expect(paths.length).toBeLessThanOrEqual(3)
    paths.forEach((path) => {
      expect(path.getAttribute('stroke')).toBeNull()
      expect(path.getAttribute('fill')).toBeNull()
    })
  })

  it('className을 svg에 전달한다', () => {
    const { container } = render(<YogurtIcon className="h-5 w-5" />)
    expect(container.querySelector('svg')).toHaveClass('h-5 w-5')
  })
})
