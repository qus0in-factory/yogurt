// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, expect, it, vi } from 'vitest'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'
afterEach(cleanup)
function setup(fail = false) {
  let assignments = [...sampleAssignments]
  const put = vi.fn()
  const remove = vi.fn()
  server.use(
    http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
    http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
    http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(assignments)),
    http.put(`${apiBase}/accounts/:accountId/products/:productCode/portfolio`, async ({ params, request }) => {
      const body = await request.json() as { portfolioId: string }
      put(params.accountId, params.productCode, body)
      if (fail) return HttpResponse.json({ error: 'fail' }, { status: 400 })
      const next = { accountId: String(params.accountId), productCode: params.productCode as '01', ...body }
      assignments = [...assignments.filter(a => a.accountId !== next.accountId || a.productCode !== next.productCode), next]
      return HttpResponse.json(next)
    }),
    http.delete(`${apiBase}/accounts/:accountId/products/:productCode/portfolio`, ({ params }) => {
      remove(params.accountId, params.productCode)
      assignments = assignments.filter(a => a.accountId !== params.accountId || a.productCode !== params.productCode)
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const { client } = renderWithQuery(<PortfolioSection />)
  return { put, remove, invalidate: vi.spyOn(client, 'invalidateQueries') }
}
it('카드 연결 버튼으로만 대화상자를 열고 PUT 교체 및 DELETE 해제 후 두 목록을 갱신한다', async () => {
  const { put, remove, invalidate } = setup()
  await screen.findByRole('heading', { name: '안정 현금형' })
  const button = screen.getAllByRole('button', { name: '연결' })[1]
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.queryByText('계좌 상품 연결')).not.toBeInTheDocument()
  fireEvent.click(button)
  const dialog = screen.getByRole('dialog')
  const isa = within(dialog).getByRole('checkbox', { name: '12345678(주계좌) ISA' })
  expect(isa).not.toBeChecked()
  expect(within(screen.getByRole('table')).getByRole('img', { name: /현재: 배당 성장형/ })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /옮겨 오기.*다른 포트폴리오 연결은 끌 수 없습니다/ })).toBeInTheDocument()
  fireEvent.click(isa)
  await waitFor(() => expect(isa).toBeChecked())
  expect(put).toHaveBeenCalledExactlyOnceWith('acc-1', '01', { portfolioId: 'p-2' })
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(isa)
  await waitFor(() => expect(isa).not.toBeChecked())
  expect(remove).toHaveBeenCalledExactlyOnceWith('acc-1', '01')
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['portfolios'] })
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['portfolio-assignments'] })
})
it('실패 시 대상 줄 오류와 이전 연결을 유지한다', async () => {
  const { put, remove } = setup(true)
  await screen.findByRole('heading', { name: '안정 현금형' })
  fireEvent.click(screen.getAllByRole('button', { name: '연결' })[1])
  const isa = screen.getByRole('checkbox', { name: '12345678(주계좌) ISA' })
  fireEvent.click(isa)
  await screen.findByRole('alert')
  expect(isa).not.toBeChecked()
  expect(isa.closest('tr')).toHaveTextContent('포트폴리오 연결을 변경하지 못했습니다.')
  expect(within(screen.getByRole('table')).getByRole('img', { name: /현재: 배당 성장형/ })).toBeInTheDocument()
  expect(put).toHaveBeenCalledTimes(1)
  expect(remove).not.toHaveBeenCalled()
})
it('자기 연결의 DELETE 실패는 체크 상태를 유지한다', async () => {
  setup()
  const remove = vi.fn(() => HttpResponse.json({ error: 'fail' }, { status: 400 }))
  server.use(http.delete(`${apiBase}/accounts/acc-1/products/01/portfolio`, remove))
  await screen.findByRole('heading', { name: '배당 성장형' })
  fireEvent.click(screen.getAllByRole('button', { name: '연결' })[0])
  const isa = screen.getByRole('checkbox', { name: '12345678(주계좌) ISA' })
  fireEvent.click(isa)
  await screen.findByRole('alert')
  expect(isa).toBeChecked()
  expect(remove).toHaveBeenCalledTimes(1)
})
