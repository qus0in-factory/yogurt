import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createAccount, listAccounts } from './client'

const accountsUrl = `${window.location.origin}/api/accounts`
const account = { id: 'a1', alias: '주계좌', accountNumber: '123-456-789', createdAt: '2026-01-01T00:00:00.000Z' }
let body: unknown

const server = setupServer(
  http.get(accountsUrl, () => HttpResponse.json([account])),
  http.post(accountsUrl, async ({ request }) => {
    body = await request.clone().json()
    return HttpResponse.json({ ...account, alias: '새 계좌' }, { status: 201 })
  }),
)

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => { server.resetHandlers(); body = undefined })
afterAll(() => server.close())

describe('accounts client', () => {
  it('목록을 스키마로 파싱한다', async () => {
    expect(await listAccounts()).toEqual([account])
  })

  it('생성 요청을 JSON으로 보내고 응답을 파싱한다', async () => {
    const created = await createAccount({ alias: '새 계좌', accountNumber: '111-222', accessKey: 'AK', secretKey: 'SK' })
    expect(created.alias).toBe('새 계좌')
    expect(body).toEqual({ alias: '새 계좌', accountNumber: '111-222', accessKey: 'AK', secretKey: 'SK' })
  })

  it('스키마에 맞지 않는 응답은 throw한다', async () => {
    server.use(http.get(accountsUrl, () => HttpResponse.json([{ id: 1 }])))
    await expect(listAccounts()).rejects.toThrow()
  })
})
