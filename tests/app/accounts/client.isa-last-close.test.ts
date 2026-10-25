import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getIsaLastClose } from '../../../src/app/accounts/client'

const url = `${window.location.origin}/api/accounts/a1/isa-last-close`
const server = setupServer(
  http.get(url, () => HttpResponse.json({ date: '2026-09-30', totalAssetsWon: 25_200_000 })),
)
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('getIsaLastClose', () => {
  it('200 응답이면 직전 월 마감 일자와 자산 원 단위를 반환한다', async () => {
    const res = await getIsaLastClose('a1')
    expect(res).toEqual({ date: '2026-09-30', totalAssetsWon: 25_200_000 })
  })

  it('404 응답이면 null을 반환한다', async () => {
    server.use(http.get(url, () => HttpResponse.json({ error: 'not found' }, { status: 404 })))
    expect(await getIsaLastClose('a1')).toBeNull()
  })

  it('응답 형식이 맞지 않으면 zod 검증 실패로 null을 반환한다', async () => {
    server.use(http.get(url, () => HttpResponse.json({ date: 'invalid', totalAssetsWon: 'abc' })))
    expect(await getIsaLastClose('a1')).toBeNull()
  })
})
