import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'

export const base = `${window.location.origin}/api`
export const draft = { name: '목표', items: [
  { kind: 'cash' as const, stockCode: null, stockName: '현금/예수금', targetWeightBps: 10000 },
] }
export const portfolio = { ...draft, id: 'p', createdAt: '2026-10-26', updatedAt: '2026-10-26' }
export const assignment = { accountId: 'a/b', productCode: '01', portfolioId: 'p' }
export const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
