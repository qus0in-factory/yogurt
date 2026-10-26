import { createElement, type PropsWithChildren } from 'react'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { useRebalanceInputs } from '../../../src/app/rebalance/useRebalanceInputs'
const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => { cleanup(); server.resetHandlers() })
afterAll(() => server.close())
const target = { accountId: 'a', productCode: '01' as const, accountNumber: '1', alias: '', portfolioId: 'p', portfolioName: '목표' }
function show(body: Parameters<typeof HttpResponse.json>[0], status = 200) {
  server.use(http.get('*/api/accounts/a/products/01/rebalance-inputs', () => HttpResponse.json(status === 200 ? { prices: {}, priceFailed: [], ...body as object } : body, { status })))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children)
  return renderHook(() => useRebalanceInputs(target), { wrapper })
}
it('서버 응답을 화면 계산 입력에 맞추고 현재가·평가액·연결 여부를 유지한다', async () => {
  const { result } = show({ holdings: [{ code: '005930', name: '삼성전자', quantity: 2, currentPrice: 100 }], cash: 50,
    targets: [{ code: '005930', name: '삼성전자', weightBps: 6000, kind: 'security' },
      { code: null, name: '현금', weightBps: 4000, kind: 'cash' }], prices: { '005930': 100, '000660': 200 }, priceFailed: ['035420'], hasPortfolio: true })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual({ holdings: [{ code: '005930', name: '삼성전자', quantity: 2, evaluationAmount: 200 }], cash: 50,
    targets: [{ code: '005930', name: '삼성전자', weightBps: 6000, kind: 'stock' },
      { code: null, name: '현금', weightBps: 4000, kind: 'cash' }], prices: { '005930': 100, '000660': 200 }, priceFailed: ['035420'], hasPortfolio: true })
})
it('연결 없음과 빈 보유·목표를 그대로 보존한다', async () => {
  const { result } = show({ holdings: [], cash: 0, targets: [], hasPortfolio: false })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual({ holdings: [], cash: 0, targets: [], prices: {}, priceFailed: [], hasPortfolio: false })
})
it('401을 빈 계좌 입력으로 바꾸지 않고 오류로 유지한다', async () => {
  const { result } = show({ error: 'unauthorized' }, 401)
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.data).toBeUndefined()
})
