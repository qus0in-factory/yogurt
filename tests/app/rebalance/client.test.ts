import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createElement, type PropsWithChildren } from 'react'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { fetchRebalanceInputs } from '../../../src/app/rebalance/client'
import { REBALANCE_INPUTS_QUERY_KEY, useRebalanceInputs } from '../../../src/app/rebalance/queries'
const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => { cleanup(); server.resetHandlers() })
afterAll(() => server.close())
const data = { holdings: [], cashAvailable: 123, cashSettled: 234, targets: [], prices: {}, priceFailed: [], hasPortfolio: false }
it('계좌/상품을 인코딩해 조회하고 응답을 검증한다', async () => {
  server.use(http.get('*/api/accounts/a%2Fb/products/01/rebalance-inputs', () => HttpResponse.json(data)))
  expect(await fetchRebalanceInputs('a/b', '01')).toEqual(data)
})
it('잘못된 입력 응답을 거부한다', async () => {
  server.use(http.get('*/api/accounts/a/products/01/rebalance-inputs', () => HttpResponse.json({ ...data, cashAvailable: -1 })))
  await expect(fetchRebalanceInputs('a', '01')).rejects.toHaveProperty('name', 'ZodError')
})
it('hook은 계좌·상품별 입력을 따로 캐시한다', async () => {
  server.use(http.get('*/api/accounts/a/products/:product/rebalance-inputs', ({ params }) =>
    HttpResponse.json({ ...data, cashAvailable: params.product === '01' ? 123 : 456, cashSettled: params.product === '01' ? 234 : 567 })))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children)
  const isa = renderHook(() => useRebalanceInputs('a', '01'), { wrapper })
  const pension = renderHook(() => useRebalanceInputs('a', '22'), { wrapper })
  await waitFor(() => expect(isa.result.current.data?.cashAvailable).toBe(123))
  await waitFor(() => expect(pension.result.current.data?.cashSettled).toBe(567))
  expect(client.getQueryData([...REBALANCE_INPUTS_QUERY_KEY, 'a', '01'])).toEqual(data)
  expect(client.getQueryData(['portfolios'])).toBeUndefined()
})
