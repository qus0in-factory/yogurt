import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createElement, type PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { fetchKeepAmount, saveKeepAmount } from '../../../src/app/rebalance/keep-amount-client'
import { KEEP_AMOUNT_QUERY_KEY, useKeepAmount, useSaveKeepAmount } from '../../../src/app/rebalance/queries'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => { cleanup(); server.resetHandlers() })
afterAll(() => server.close())
const path = (account: string, product: string) => `*/api/accounts/${account}/products/${product}/rebalance-keep-amount`

it('계좌/상품을 인코딩해 조회하고 저장은 PUT 본문을 보낸다', async () => {
  server.use(http.get(path('a%2Fb', '01'), () => HttpResponse.json({ keepAmount: 1234 })))
  expect(await fetchKeepAmount('a/b', '01')).toEqual({ keepAmount: 1234 })

  let sent: unknown
  server.use(http.put(path('a%2Fb', '01'), async ({ request }) => {
    sent = await request.json()
    return HttpResponse.json({ keepAmount: 1234 })
  }))
  expect(await saveKeepAmount('a/b', '01', 1234)).toEqual({ keepAmount: 1234 })
  expect(sent).toEqual({ keepAmount: 1234 })
})

it('잘못된 응답은 ZodError로 거부한다', async () => {
  server.use(http.get(path('a', '01'), () => HttpResponse.json({ keepAmount: -1 })))
  await expect(fetchKeepAmount('a', '01')).rejects.toHaveProperty('name', 'ZodError')
})

it('훅은 계좌·상품별로 캐시하고 저장 결과를 같은 키에 반영한다', async () => {
  server.use(http.get(path('a', '01'), () => HttpResponse.json({ keepAmount: 1234 })))
  server.use(http.put(path('a', '01'), () => HttpResponse.json({ keepAmount: 1234 })))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children)
  const read = renderHook(() => useKeepAmount('a', '01'), { wrapper })
  await waitFor(() => expect(read.result.current.data?.keepAmount).toBe(1234))
  expect(client.getQueryData([...KEEP_AMOUNT_QUERY_KEY, 'a', '01'])).toEqual({ keepAmount: 1234 })

  const save = renderHook(() => useSaveKeepAmount('a', '01'), { wrapper })
  await save.result.current.mutateAsync(1234)
  await waitFor(() => expect(client.getQueryData([...KEEP_AMOUNT_QUERY_KEY, 'a', '01'])).toEqual({ keepAmount: 1234 }))
})
