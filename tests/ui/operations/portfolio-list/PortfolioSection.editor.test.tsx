// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OperationsPage } from '../../../../src/ui/operations/OperationsPage'
import { useOperationsStore } from '../../../../src/ui/state/operations-store'
import { apiBase, renderWithQuery, sampleAccounts, sampleAssignments, samplePortfolios, server } from './test-helpers'

afterEach(cleanup)

describe('OperationsPage 포트폴리오 목록 및 편집 다이얼로그 연결', () => {
  beforeEach(() => {
    useOperationsStore.setState({ tab: 'portfolio' })
  })

  it('포트폴리오 탭에서 목록이 보이고 새 포트폴리오 생성 성공 시 다이얼로그가 닫히며 목록이 갱신된다', async () => {
    let list = [...samplePortfolios]
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(list)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
      http.post(`${apiBase}/portfolios`, async ({ request }) => {
        const body = (await request.json()) as { name: string; items: typeof samplePortfolios[0]['items'] }
        const created = { ...body, id: 'p-3', createdAt: '2026-10-26T01:00:00Z', updatedAt: '2026-10-26T01:00:00Z' }
        list = [...list, created]
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    renderWithQuery(<OperationsPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '새 포트폴리오' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: '새 포트폴리오' })).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('포트폴리오 이름'), { target: { value: '신규 올웨더' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '현금 추가' }))
    fireEvent.change(within(dialog).getByLabelText('목표 비중 (%)'), { target: { value: '100' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('heading', { name: '신규 올웨더' })).toBeInTheDocument())
  })

  it('편집 버튼 클릭 시 기존 값과 연결 대상 수를 채워 열고, 저장 실패 시 초안을 유지하며 성공 시 갱신한다', async () => {
    let list = [...samplePortfolios]
    let shouldFail = true
    server.use(
      http.get(`${apiBase}/portfolios`, () => HttpResponse.json(list)),
      http.get(`${apiBase}/portfolio-assignments`, () => HttpResponse.json(sampleAssignments)),
      http.get(`${apiBase}/accounts`, () => HttpResponse.json(sampleAccounts)),
      http.put(`${apiBase}/portfolios/p-1`, async ({ request }) => {
        if (shouldFail) return HttpResponse.json({ error: 'server error' }, { status: 500 })
        const body = (await request.json()) as { name: string; items: typeof samplePortfolios[0]['items'] }
        list = list.map((p) => (p.id === 'p-1' ? { ...p, ...body } : p))
        return HttpResponse.json(list[0])
      }),
    )
    renderWithQuery(<OperationsPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: '배당 성장형' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '배당 성장형 편집' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('연결된 1개 대상의 목표가 함께 변경됩니다')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('포트폴리오 이름')).toHaveValue('배당 성장형')

    fireEvent.change(within(dialog).getByLabelText('포트폴리오 이름'), { target: { value: '배당 성장형 v2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '저장' }))
    await waitFor(() => expect(within(dialog).getByText('포트폴리오를 저장하지 못했습니다.')).toBeInTheDocument())
    expect(within(dialog).getByLabelText('포트폴리오 이름')).toHaveValue('배당 성장형 v2')

    shouldFail = false
    fireEvent.click(within(dialog).getByRole('button', { name: '저장' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('heading', { name: '배당 성장형 v2' })).toBeInTheDocument())
  })
})
