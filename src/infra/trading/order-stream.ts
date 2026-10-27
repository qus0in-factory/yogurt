import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { KisAccountClient } from '../kis/kis-stock-balance.ts'
import { isMarketOpen } from '../../domain/market/session.ts'
import { MARKET_HOLIDAYS } from '../../domain/market/holidays.ts'
import { fetchOrderFill } from '../kis/kis-order-status.ts'
import { classifyFill, type FillNumbers, type FillStatus } from '../../domain/trading/order-fill.ts'
import { checkedProduct, kstDayString } from './order-contracts.ts'
import { requireClaims } from './order-idempotency.ts'

export type Ctx = Context<{ Bindings: Env }>
export type Resolve = (c: Ctx, id: string) => Promise<KisAccountClient | null>

export type StreamDeps = {
  resolveAccount?: (c: Ctx, id: string) => Promise<KisAccountClient | null>
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  intervalMs?: number
  maxMs?: number
}
// 주기 폴링(기본 5초, 최소 1초). 상태가 바뀐 주문만 fill 이벤트를 보낸다.
// 전부 filled/closed_partial/cancelled이면 done 후 종료, 최대 유지 시간(기본 5분)이 지나면 닫는다.
// 장 마감 중에는 한 번만 조회하고 닫는다. KIS 호출은 라운드당 직렬로만 보낸다. 일시 제한(rate_limited) 후엔 폴링 주기를 2배로 늘린다(상한 20초).
const DEFAULT_INTERVAL_MS = 5000, RATE_LIMIT_MAX_INTERVAL_MS = 20000
const DEFAULT_MAX_MS = 5 * 60 * 1000
const MAX_ORDER_IDS = 7
const ID_PATTERN = /^[A-Za-z0-9-]{1,40}$/

export function streamFillOrders(c: Ctx, deps: StreamDeps = {}) {
  const {
    resolveAccount,
    sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    now = Date.now,
    intervalMs = DEFAULT_INTERVAL_MS,
    maxMs = DEFAULT_MAX_MS,
  } = deps
  return (async () => {
    const rawIds = (c.req.query('orderIds') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    const diag = (code: string) => console.info(JSON.stringify({ kind: 'stream-diag', code, orderIdCount: rawIds.length }))
    const productCode = await checkedProduct(c)
    if (!productCode || rawIds.length === 0 || rawIds.length > MAX_ORDER_IDS || rawIds.some((id) => !ID_PATTERN.test(id))) {
      diag('INVALID_ORDER_IDS')
      return c.json({ error: 'invalid request', code: 'INVALID_ORDER_IDS' }, 400)
    }
    const accountId = c.req.param('accountId') ?? ''
    const account = resolveAccount ? await resolveAccount(c, accountId) : null
    if (!account) { diag('ACCOUNT_NOT_FOUND'); return c.json({ error: 'account not found', code: 'ACCOUNT_NOT_FOUND' }, 404) }
    if (!c.env.DB) return c.json({ error: 'order storage unavailable', code: 'ORDER_STORAGE_UNAVAILABLE' }, 503)
    if (!(await requireClaims(c.env.DB, accountId, productCode, rawIds))) {
      diag('ORDER_NOT_FOUND')
      return c.json({ error: 'order not found', code: 'ORDER_NOT_FOUND' }, 404)
    }
    const closed = !isMarketOpen(new Date(now()), MARKET_HOLIDAYS).open
    const day = kstDayString(now())
    return streamSSE(c, async (stream) => {
      const start = now()
      const last = new Map<string, FillStatus>()
      const finished = new Set<string>()
      let delay = Math.max(1000, intervalMs)
      for (;;) {
        if (now() - start >= maxMs || finished.size >= rawIds.length) break
        const checkedAt = new Date(now()).toISOString()
        let rateLimited = false
        for (const orderId of rawIds) {
          if (finished.has(orderId)) continue
          const numbers = await fetchOrderFill(account, productCode, orderId, day)
          const status = classifyFill(numbers); if (status === 'rate_limited') rateLimited = true
          if (status !== last.get(orderId)) {
            last.set(orderId, status)
            await stream.writeSSE({ event: 'fill', data: JSON.stringify({ orderId, status, filledQty: numbers?.filledQty ?? 0, remainingQty: numbers?.remainingQty ?? 0, checkedAt }) })
          }
          if (status === 'filled' || status === 'closed_partial' || status === 'cancelled') finished.add(orderId)
        }
        if (finished.size >= rawIds.length || closed) break
        await sleep(delay = rateLimited ? Math.min(RATE_LIMIT_MAX_INTERVAL_MS, delay * 2) : Math.max(1000, intervalMs))
      }
      await stream.writeSSE({ event: 'done', data: JSON.stringify({ finished: [...finished] }) })
    })
  })()
}
