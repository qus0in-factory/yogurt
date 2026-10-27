import type { KisAccountClient } from '../kis/kis-stock-balance'
// KIS official: examples_llm/domestic_stock/inquire_price/inquire_price.py
export const INQUIRE_PRICE = { path: '/uapi/domestic-stock/v1/quotations/inquire-price', trId: 'FHKST01010100' } as const
export type Quote = { code: string; price: number; asOf: string }
export class QuoteError extends Error {
  constructor(readonly status: 404 | 503) { super(status === 404 ? 'STOCK_NOT_FOUND' : 'STOCK_LOOKUP_UNAVAILABLE') }
}
export async function inquirePrice(client: Pick<KisAccountClient, 'request'>, code: string): Promise<Quote> {
  try {
    const res = await client.request(INQUIRE_PRICE.path, {
      method: 'GET', trId: INQUIRE_PRICE.trId,
      query: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: code },
    })
    if (res.status === 404) throw new QuoteError(404)
    if (!res.ok) throw new QuoteError(503)
    const raw = await res.json() as { rt_cd?: string; output?: { stck_prpr?: string } }
    if (raw.rt_cd !== '0') throw new QuoteError(503)
    if (!raw.output?.stck_prpr?.trim()) throw new QuoteError(404)
    const price = Number(raw.output.stck_prpr)
    if (!Number.isSafeInteger(price) || price <= 0) throw new QuoteError(503)
    return { code, price, asOf: new Date().toISOString() }
  } catch (error) {
    if (error instanceof QuoteError) throw error
    throw new QuoteError(503)
  }
}
