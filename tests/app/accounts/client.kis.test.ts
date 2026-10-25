import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { requestKisToken } from '../../../src/app/accounts/client'

const url = `${window.location.origin}/api/accounts/a1/kis-token`
const server = setupServer(http.post(url, () => HttpResponse.json({ issued: true, expiresAt: 1700000000000 })))
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('requestKisToken', () => {
  it('POST로 요청하고 issued·expiresAt를 파싱한다', async () => {
    expect(await requestKisToken('a1')).toEqual({ issued: true, expiresAt: 1700000000000 })
  })

  it('응답이 스키마와 다르면 throw한다', async () => {
    server.use(http.post(url, () => HttpResponse.json({ issued: 'yes' })))
    await expect(requestKisToken('a1')).rejects.toThrow()
  })
})
