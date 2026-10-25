import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { setProductPlan } from '../../../src/app/accounts/client'

const url = `${window.location.origin}/api/accounts/a1/products/01/plan`
const account = {
  id: 'a1', alias: '주계좌', owner: '홍길동', accountNumber: '12345678',
  products: ['01'], createdAt: '2026-01-01T00:00:00.000Z',
  productPlans: { '01': { startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null } },
}
let body: unknown
const server = setupServer(http.put(url, async ({ request }) => {
  body = await request.json()
  return HttpResponse.json(account)
}))
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => { server.resetHandlers(); body = undefined })
afterAll(() => server.close())

describe('setProductPlan', () => {
  it('PUT plan 경로에 세 필드를 보내고 계획을 파싱한다', async () => {
    const updated = await setProductPlan('a1', '01', {
      startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null,
    })
    expect(body).toEqual({ startDate: '2024-03-15', minTargetAmountWon: 12_500_000, maxTargetAmountWon: null })
    expect(updated.productPlans['01'].minTargetAmountWon).toBe(12_500_000)
  })

  it('계획 삭제는 세 필드 모두 null을 보낸다', async () => {
    await setProductPlan('a1', '01', { startDate: null, minTargetAmountWon: null, maxTargetAmountWon: null })
    expect(body).toEqual({ startDate: null, minTargetAmountWon: null, maxTargetAmountWon: null })
  })

  it('상품이 없으면 404 오류를 던진다', async () => {
    server.use(http.put(url, () => HttpResponse.json({ error: 'product not enabled' }, { status: 404 })))
    await expect(setProductPlan('a1', '01', {
      startDate: '2024-03-15', minTargetAmountWon: null, maxTargetAmountWon: null,
    })).rejects.toThrow()
  })
})
