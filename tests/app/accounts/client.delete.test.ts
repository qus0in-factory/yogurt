import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { HTTPError } from 'ky'
import { deleteAccount } from '../../../src/app/accounts/client'

const url = `${window.location.origin}/api/accounts/a1`
let received: Pick<Request, 'url' | 'method' | 'text'> | undefined
const server = setupServer(http.delete(url, ({ request }) => {
  received = request
  return new HttpResponse(null, { status: 204 })
}))
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => { server.resetHandlers(); received = undefined })
afterAll(() => server.close())

it('deleteAccount는 id 경로에 DELETE하고 204를 파싱하지 않는다', async () => {
  await expect(deleteAccount('a1')).resolves.toBeUndefined()
  expect(received?.url).toBe(url)
  expect(received?.method).toBe('DELETE')
  expect(await received?.text()).toBe('')
})

it('삭제 대상이 없으면 HTTP 오류를 전달한다', async () => {
  server.use(http.delete(url, () => HttpResponse.json({ error: 'account not found' }, { status: 404 })))
  await expect(deleteAccount('a1')).rejects.toBeInstanceOf(HTTPError)
})

it('id를 URL 경로 조각으로 인코딩한다', async () => {
  const encodedUrl = `${window.location.origin}/api/accounts/a%2Fb`
  server.use(http.delete(encodedUrl, ({ request }) => {
    received = request
    return new HttpResponse(null, { status: 204 })
  }))
  await deleteAccount('a/b')
  expect(received?.url).toBe(encodedUrl)
})
