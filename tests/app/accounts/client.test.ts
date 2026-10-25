import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createAccount, listAccounts, updateAccount } from '../../../src/app/accounts/client'

const accountsUrl = `${window.location.origin}/api/accounts`
const account = { id: 'a1', alias: '주계좌', owner: '홍길동', accountNumber: '12345678', products: [], productPlans: {}, createdAt: '2026-01-01T00:00:00.000Z' }
let body: unknown
const server = setupServer(
  http.get(accountsUrl, () => HttpResponse.json([account])),
  http.post(accountsUrl, async ({ request }) => {
    body = await request.clone().json()
    return HttpResponse.json({ ...account, alias: '새 계좌' }, { status: 201 })
  }),
  http.patch(`${accountsUrl}/a1`, async ({ request }) => {
    body = await request.json()
    return HttpResponse.json({ ...account, alias: '수정', owner: '김철수' })
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
    const input = { alias: '새 계좌', owner: '홍길동', accountNumber: '11112222', accessKey: 'AK', secretKey: 'SK', products: []}
    expect((await createAccount(input)).alias).toBe('새 계좌')
    expect(body).toEqual(input)
  })

  it('스키마에 맞지 않는 응답은 throw한다', async () => {
    server.use(http.get(accountsUrl, () => HttpResponse.json([{ id: 1 }])))
    await expect(listAccounts()).rejects.toThrow()
  })

  it('수정 요청은 id 경로에 alias·owner JSON을 PATCH하고 응답을 파싱한다', async () => {
    const updated = await updateAccount('a1', { alias: '수정', owner: '김철수' })
    expect(body).toEqual({ alias: '수정', owner: '김철수' })
    expect(updated).toEqual({ ...account, alias: '수정', owner: '김철수' })
  })

  it('수정 응답이 스키마와 다르면 throw한다', async () => {
    server.use(http.patch(`${accountsUrl}/a1`, () => HttpResponse.json({ id: 'a1' })))
    await expect(updateAccount('a1', { alias: '수정', owner: '김철수' })).rejects.toThrow()
  })
})
