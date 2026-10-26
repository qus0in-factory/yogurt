// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import { PortfolioAssignmentDialog } from '../../../../src/ui/operations/portfolio-list/PortfolioAssignmentDialog'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
async function show(startDate?: string) {
  vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-12-31T15:00:00Z').getTime())
  const accounts = sampleAccounts.map(account => ({ ...account, productPlans: startDate
    ? { '01': { startDate, minTargetAmountWon: null, maxTargetAmountWon: null } } : {} }))
  server.use(
    http.get(`${apiBase}/accounts`, () => HttpResponse.json(accounts)),
    http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
    http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
  )
  renderWithQuery(<PortfolioAssignmentDialog portfolio={samplePortfolios[0]} onClose={() => {}} />)
  const checkbox = await screen.findByRole('checkbox', { name: '12345678(주계좌) ISA' })
  return {
    isa: within(checkbox.closest('tr')!).getAllByRole('cell')[2],
    pension: within(screen.getByRole('checkbox', { name: '12345678(주계좌) 연금저축' }).closest('tr')!).getAllByRole('cell')[2],
  }
}
it.each([
  ['2027-01-01', '1년차'], ['2026-01-01', '2년차'], ['2025-01-01', '3년차'],
  ['2027-02-01', '시작 전'],
])('서울 날짜 기준 ISA %s 시작 연차 %s를 상품명 셀에만 표시한다', async (start, label) => {
  const { isa, pension } = await show(start)
  expect(isa).toHaveTextContent(`ISA · ${label}`)
  expect(within(isa).getByText(`· ${label}`)).toHaveClass('text-stone-500')
  expect(pension).toHaveTextContent(/^연금저축$/)
})
it('계획이 없으면 ISA 행은 유지하고 연차를 숨긴다', async () => {
  const { isa } = await show()
  expect(isa).toHaveTextContent(/^ISA$/)
})
it('만기 후에는 ISA 행은 유지하고 연차를 숨긴다', async () => {
  const { isa } = await show('2020-01-01')
  expect(isa).toHaveTextContent(/^ISA$/)
})
