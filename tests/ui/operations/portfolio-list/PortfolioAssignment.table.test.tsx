// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, expect, it } from 'vitest'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(cleanup)
it('연결 버튼 장식 아이콘과 접근 가능한 체크가 앞에 있는 4열 테이블을 표시한다', async () => {
  server.use(
    http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
    http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
    http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
  )
  window.innerWidth = 375
  renderWithQuery(<PortfolioSection />)
  await screen.findByRole('heading', { name: '배당 성장형' })
  const card = screen.getByRole('heading', { name: '배당 성장형' }).closest('article')!
  const button = within(card).getByRole('button', { name: '연결' })
  expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  expect(button).toHaveClass('min-h-11')
  fireEvent.click(button)
  const table = await screen.findByRole('table', { name: '계좌 상품 연결' })
  const headers = within(table).getAllByRole('columnheader')
  expect(headers.map(h => h.textContent)).toEqual(['연결', '계좌번호(별칭)', '상품명', '상태'])
  expect(headers[0]).toHaveClass('w-9', 'min-w-9', 'max-w-9', 'px-1', 'whitespace-nowrap')
  expect(headers[1]).not.toHaveClass('w-9')
  const heading = within(screen.getByRole('dialog')).getByRole('heading')
  const name = within(heading).getByText('배당 성장형')
  expect(name.tagName).toBe('STRONG')
  expect(name).toHaveClass('font-semibold', 'break-words', '[overflow-wrap:anywhere]')
  expect(within(heading).getByText('계좌 상품 연결')).toHaveClass('block', 'font-normal')
  headers.forEach(h => expect(h).toHaveAttribute('scope', 'col'))
  const rows = within(table).getAllByRole('row').slice(1)
  expect(rows).toHaveLength(2)
  expect(within(table).queryByText('IRP')).not.toBeInTheDocument()
  expect(within(table).queryByRole('checkbox', { name: /IRP/ })).not.toBeInTheDocument()
  expect(within(rows[1]).getByRole('cell', { name: '연금저축' })).toBeInTheDocument()
  expect(within(rows[0]).getAllByRole('cell').map(c => c.textContent)).toEqual([
    '', '12345678(주계좌)', 'ISA', '',
  ])
  expect(within(rows[0]).getAllByRole('cell')[0]).toHaveClass('w-9', 'min-w-9', 'max-w-9', 'px-1')
  expect(within(rows[0]).getByRole('img', { name: '이 포트폴리오에 연결됨' })).toBeInTheDocument()
  expect(within(rows[1]).getByRole('img', { name: '연결 없음' })).toBeInTheDocument()
  expect(within(rows[0]).getAllByRole('cell')[0]).toContainElement(within(rows[0]).getByRole('checkbox'))
  expect(table.parentElement).toHaveClass('overflow-x-auto', 'max-w-full')
  expect(table).toHaveClass('whitespace-nowrap')
})
