import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { AdaptiveDisclosure } from '../../../src/ui/components/AdaptiveDisclosure'
import { overviewText as text } from '../../../src/ui/glossary/overview'

const footer = <li>cash</li>

function list(count: number) {
  return Array.from({ length: count }, (_, index) => <li key={index}>종목{index + 1}</li>)
}
function show(total = 5, limit = 2) {
  return render(
    <AdaptiveDisclosure title="보유 종목" total={total} limit={limit} footer={footer}>
      {list(total)}
    </AdaptiveDisclosure>,
  )
}
afterEach(cleanup)

it('기본 접힘 상태에서는 limit개만 보여주고 펼치기 버튼을 제공한다', () => {
  show()
  const button = screen.getByRole('button', { name: /나머지 3개 보기/ })
  expect(button).toHaveAccessibleName(/총 5개/)
  expect(button).toHaveAccessibleName(/접힘/)
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(button).toHaveClass('min-h-11')
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByText('종목2')).toBeInTheDocument()
  expect(screen.queryByText('종목3')).not.toBeInTheDocument()
  expect(screen.queryByText('cash')).not.toBeInTheDocument()
})

it('펼치면 전체 항목과 footer를 보여주고 다시 접을 수 없다', () => {
  show()
  fireEvent.click(screen.getByRole('button', { name: /나머지 3개 보기/ }))
  expect(screen.getAllByRole('listitem')).toHaveLength(6)
  expect(screen.getByText('종목5')).toBeInTheDocument()
  expect(screen.getByText('cash')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  const heading = screen.getByRole('heading', { name: /총 5개/ })
  expect(heading).toHaveTextContent('펼침')
})

it('total이 limit 이하이면 버튼 없이 전체와 footer를 보여준다', () => {
  show(2, 2)
  expect(screen.getByRole('heading', { name: /보유 종목 총 2개/ })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByText('종목2')).toBeInTheDocument()
  expect(screen.getByText('cash')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

it('glossary는 접힘·펼침·더보기 문구를 제공한다', () => {
  expect(text.showMore(3)).toBe('나머지 3개 보기')
  expect(text.collapsed).toBe('접힘')
  expect(text.expanded).toBe('펼침')
  expect(text.total(5)).toBe('총 5개')
})
