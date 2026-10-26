import { expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { clearPortfolioAssignment, listPortfolioAssignments, setPortfolioAssignment } from '../../../src/app/portfolio/assignments-client'
import { assignment, base, server } from './fixtures'

const url = `${base}/accounts/a%2Fb/products/01/portfolio`
it('연결 목록 GET을 응답 스키마로 검증한다', async () => {
  server.use(http.get(`${base}/portfolio-assignments`, () => HttpResponse.json([assignment])))
  expect(await listPortfolioAssignments()).toEqual([assignment])
  server.use(http.get(`${base}/portfolio-assignments`, () => HttpResponse.json([])))
  expect(await listPortfolioAssignments()).toEqual([])
})
it('상품 연결 PUT의 경로와 portfolioId 바디를 확인한다', async () => {
  let body: unknown
  server.use(http.put(url, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json(assignment)
  }))
  expect(await setPortfolioAssignment('a/b', '01', ' p ')).toEqual(assignment)
  expect(body).toEqual({ portfolioId: 'p' })
})
it('상품 연결 DELETE의 204는 본문을 읽지 않는다', async () => {
  server.use(http.delete(url, () => new HttpResponse(null, { status: 204 })))
  await expect(clearPortfolioAssignment('a/b', '01')).resolves.toBeUndefined()
})
it.each([null, {}, [{ ...assignment, productCode: '99' }]])('잘못된 연결 목록 %j', async body => {
  server.use(http.get(`${base}/portfolio-assignments`, () => HttpResponse.json(body)))
  await expect(listPortfolioAssignments()).rejects.toHaveProperty('name', 'ZodError')
})
it('연결 설정의 잘못된 응답을 거부한다', async () => {
  server.use(http.put(url, () => HttpResponse.json({ ...assignment, portfolioId: '' })))
  await expect(setPortfolioAssignment('a/b', '01', 'p')).rejects.toHaveProperty('name', 'ZodError')
})
it('빈 포트폴리오 ID는 요청 전에 거부한다', async () => {
  await expect(setPortfolioAssignment('a/b', '01', ' ')).rejects.toHaveProperty('name', 'ZodError')
})
