import { describe, expect, it, vi } from 'vitest'
import { api } from '../../../src/app/http/http'
import { fetchMarketStatus } from '../../../src/app/market/market-client'

vi.mock('../../../src/app/http/http')

describe('fetchMarketStatus', () => {
  it('정상 장 상태 응답을 zod로 파싱하여 반환한다', async () => {
    const mock = { open: true, reason: 'open', nextOpenAt: '2026-10-27T00:00:00.000Z' }
    vi.mocked(api.get).mockReturnValue({ json: vi.fn().mockResolvedValue(mock) } as never)

    const res = await fetchMarketStatus()
    expect(res).toEqual(mock)
  })

  it('응답 형식이 스키마와 다르면 zod 검증 에러를 던진다', async () => {
    const invalidMock = { open: 'not-boolean', reason: 'invalid-reason' }
    vi.mocked(api.get).mockReturnValue({ json: vi.fn().mockResolvedValue(invalidMock) } as never)

    await expect(fetchMarketStatus()).rejects.toThrow()
  })
})
