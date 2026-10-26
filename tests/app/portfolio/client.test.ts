import { expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { createPortfolio, deletePortfolio, listPortfolios, updatePortfolio } from '../../../src/app/portfolio/client'
import { base, draft, portfolio, server } from './fixtures'

it('목록 GET과 빈 목록을 파싱한다', async () => {
  server.use(http.get(`${base}/portfolios`, () => HttpResponse.json([portfolio])))
  expect(await listPortfolios()).toEqual([portfolio])
  server.use(http.get(`${base}/portfolios`, () => HttpResponse.json([])))
  expect(await listPortfolios()).toEqual([])
})
it('생성 POST의 정규화한 바디와 201 응답을 확인한다', async () => {
  let body: unknown
  server.use(http.post(`${base}/portfolios`, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json(portfolio, { status: 201 })
  }))
  expect(await createPortfolio({ ...draft, name: ' 목표 ' })).toEqual(portfolio)
  expect(body).toEqual(draft)
})
it('인코딩된 ID로 전체 수정 PUT을 보낸다', async () => {
  let body: unknown
  server.use(http.put(`${base}/portfolios/p%2F1`, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json(portfolio)
  }))
  expect(await updatePortfolio('p/1', draft)).toEqual(portfolio)
  expect(body).toEqual(draft)
})
it('DELETE 204는 JSON을 읽지 않는다', async () => {
  server.use(http.delete(`${base}/portfolios/p%2F1`, () => new HttpResponse(null, { status: 204 })))
  await expect(deletePortfolio('p/1')).resolves.toBeUndefined()
})
it.each([null, {}, [{ ...portfolio, items: [] }]])('잘못된 목록 응답 %j를 거부한다', async body => {
  server.use(http.get(`${base}/portfolios`, () => HttpResponse.json(body)))
  await expect(listPortfolios()).rejects.toHaveProperty('name', 'ZodError')
})
it.each(['create', 'update'] as const)('%s의 잘못된 응답을 거부한다', async action => {
  server.use(http.all(`${base}/portfolios*`, () => HttpResponse.json({ id: 'p' })))
  const call = action === 'create' ? createPortfolio(draft) : updatePortfolio('p', draft)
  await expect(call).rejects.toHaveProperty('name', 'ZodError')
})
it('유효하지 않은 초안은 요청 전에 거부한다', async () => {
  await expect(createPortfolio({ ...draft, items: [] })).rejects.toHaveProperty('name', 'ZodError')
  await expect(updatePortfolio('p', { ...draft, name: '' })).rejects.toHaveProperty('name', 'ZodError')
})
