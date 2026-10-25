import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { reorderAccounts } from '../../../src/app/accounts/client'

const url = `${window.location.origin}/api/accounts/order`
const rows = ['b', 'a'].map((id) => ({ id, alias: id, owner: '소유자', accountNumber: '12345678', products: [], createdAt: '' }))
let body: unknown
const server = setupServer(http.put(url, async ({ request }) => { body = await request.json(); return HttpResponse.json(rows) }))
beforeAll(() => server.listen())
afterEach(() => { server.resetHandlers(); body = undefined })
afterAll(() => server.close())

it('ids 순열을 PUT하고 응답 계좌를 검증한다', async () => {
  expect(await reorderAccounts(['b', 'a'])).toEqual(rows)
  expect(body).toEqual({ ids: ['b', 'a'] })
})
