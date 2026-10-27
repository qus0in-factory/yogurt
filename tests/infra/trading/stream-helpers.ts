import { Hono } from 'hono'
import { vi } from 'vitest'
import { targetExists } from '../../../src/infra/portfolio/assignment-repository.ts'
import { claimOrder, markSending, markSucceeded } from '../../../src/infra/trading/order-idempotency.ts'
import { createOrderRoutes } from '../../../src/infra/trading/order-routes.ts'
import { fakeClaimDb } from './fake-claim-db'

vi.mock('../../../src/infra/portfolio/assignment-repository.ts', () => ({ targetExists: vi.fn() }))

export const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
export const MONDAY = new Date('2026-10-26T01:00:00Z').getTime()
export const SUNDAY = new Date('2026-10-25T01:00:00Z').getTime()
export function ccldRow(filled: string, remaining: string, cancelled = 'N') {
  return { odno: 'O-1', ord_qty: '10', tot_ccld_qty: filled, rmn_qty: remaining, cncl_yn: cancelled }
}
export function setup(kisHandler: (url: string) => Response, startMs: number, maxMs = 12000) {
  vi.mocked(targetExists).mockResolvedValue(true)
  let t = startMs
  let sleeps = 0
  const sleepMs: number[] = []
  const client = {
    accountNumber: '1234567801',
    hashkey: async () => 'h',
    request: vi.fn(async (path: string, options: { query?: Record<string, string> }) => kisHandler(`${path}?${new URLSearchParams(options.query ?? {}).toString()}`)),
  }
  const { db } = fakeClaimDb()
  const app = new Hono<{ Bindings: Env }>().route('/api', createOrderRoutes({
    fetchFn: (async () => { throw new Error('no real calls') }) as typeof fetch,
    resolveAccount: async () => client as never,
    sleep: async (ms: number) => { sleeps += 1; sleepMs.push(ms); t += ms },
    now: () => t,
    intervalMs: 5000,
    maxMs,
  }))
  const env = { DB: db } as unknown as Env
  return { db, client, getSleeps: () => sleeps, getSleepMs: () => sleepMs, open: (path: string) => app.request(path, { method: 'GET' }, env) }
}
export async function readEvents(res: Response): Promise<{ event: string; data: string }[]> {
  return (await res.text()).split('\n\n').filter(Boolean).map((block) => {
    const event = (block.match(/^event: (.*)$/m)?.[1] ?? '').trim()
    const data = (block.match(/^data: (.*)$/m)?.[1] ?? '').trim()
    return { event, data }
  })
}
export async function seed(db: D1Database, id: string, orderNo: string) {
  await claimOrder(db, id)
  await markSending(db, id)
  await markSucceeded(db, id, orderNo, 't', 'a1', '01')
}
