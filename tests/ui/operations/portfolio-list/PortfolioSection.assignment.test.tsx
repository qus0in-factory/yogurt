// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioSection } from '../../../../src/ui/operations/portfolio-list/PortfolioSection'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(cleanup)

describe('PortfolioSection 계좌 상품 연결 선택', () => {
  it('활성 상품(01/22/29)마다 연결을 표시하고 같은 포트폴리오 다중 연결·교체·해제를 수행한다', async () => {
    let assignments = [...sampleAssignments]
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(assignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
      http.put(`${apiBase}/accounts/:accountId/products/:productCode/portfolio`, async ({ params, request }) => {
        const body = (await request.json()) as { portfolioId: string }
        const next = {
          accountId: String(params.accountId),
          productCode: String(params.productCode) as '01' | '22' | '29',
          portfolioId: body.portfolioId,
        }
        assignments = [
          ...assignments.filter((a) => !(a.accountId === next.accountId && a.productCode === next.productCode)),
          next,
        ]
        return HttpResponse.json(next)
      }),
      http.delete(`${apiBase}/accounts/:accountId/products/:productCode/portfolio`, ({ params }) => {
        assignments = assignments.filter((a) => !(a.accountId === params.accountId && a.productCode === params.productCode))
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderWithQuery(<PortfolioSection />)

    const isaSelect = await screen.findByLabelText('홍길동 · 주계좌 · ISA 포트폴리오 선택')
    const pensionSelect = screen.getByLabelText('홍길동 · 주계좌 · 연금저축 포트폴리오 선택')
    const irpSelect = screen.getByLabelText('김철수 · 퇴직계좌 · IRP 포트폴리오 선택')
    expect(isaSelect).toHaveValue('p-1')
    expect(pensionSelect).toHaveValue('')
    expect(irpSelect).toHaveValue('')

    fireEvent.change(pensionSelect, { target: { value: 'p-1' } })
    await waitFor(() => expect(pensionSelect).toHaveValue('p-1'))

    fireEvent.change(isaSelect, { target: { value: 'p-2' } })
    await waitFor(() => expect(isaSelect).toHaveValue('p-2'))

    fireEvent.change(isaSelect, { target: { value: '' } })
    await waitFor(() => expect(isaSelect).toHaveValue(''))
  })

  it('연결 변경 실패 시 이전 선택을 유지하고 오류를 표시하며, 계좌 삭제 후 새로고침 시 사라진 대상을 정리한다', async () => {
    let accounts = [...sampleAccounts]
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(samplePortfolios)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(accounts)),
      http.put(`${apiBase}/accounts/acc-1/products/01/portfolio`, () =>
        HttpResponse.json({ error: 'target not found', code: 'TARGET_NOT_FOUND' }, { status: 404 }),
      ),
    )
    renderWithQuery(<PortfolioSection />)

    const isaSelect = await screen.findByLabelText('홍길동 · 주계좌 · ISA 포트폴리오 선택')
    expect(isaSelect).toHaveValue('p-1')

    fireEvent.change(isaSelect, { target: { value: 'p-2' } })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('포트폴리오 연결을 변경하지 못했습니다.'))
    expect(isaSelect).toHaveValue('p-1')

    accounts = [sampleAccounts[0]]
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }))
    await waitFor(() => expect(screen.queryByLabelText('김철수 · 퇴직계좌 · IRP 포트폴리오 선택')).not.toBeInTheDocument())
  })
})
