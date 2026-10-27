import { KisApiError, type KisAccountClient } from './kis-stock-balance.ts'
import { splitAccount } from './kis-order-check.ts'

export const OPEN_ORDERS_PATH = '/uapi/domestic-stock/v1/trading/inquire-psbl-rvsecncl'
export const OPEN_ORDERS_TR_ID = 'TTTC8036R'
const QUERY = { CTX_AREA_FK100: '', CTX_AREA_NK100: '', INQR_DVSN_1: '0', INQR_DVSN_2: '0' } as const

export type OpenOrder = {
  orderId: string; orgNo: string; code: string; name: string; side: 'buy' | 'sell'
  cancellable?: boolean; orderQty: number; filledQty: number; remainingQty: number; price: number; orderedAt: string
}
export type OpenOrderMeta = { order: OpenOrder; ordDvsn: string }
type Row = Record<string, unknown>
const int = (value: unknown) => { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0 }
const text = (value: unknown) => String(value ?? '')
const stripZeros = (value: string) => value.replace(/^0+/, '') || '0'

async function fetchMetas(account: KisAccountClient, productCode: string, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))): Promise<OpenOrderMeta[]> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const rows: Row[] = []
  const ctx = { fk: '', nk: '' }
  for (let page = 0; page < 3; page++) {
    const response = await account.request(OPEN_ORDERS_PATH, {
      method: 'GET', trId: OPEN_ORDERS_TR_ID,
      query: { CANO: cano, ACNT_PRDT_CD: prdt, ...QUERY, CTX_AREA_FK100: ctx.fk, CTX_AREA_NK100: ctx.nk },
    })
    let raw: { rt_cd?: string; msg_cd?: string; msg1?: string; output1?: Row[]; output?: Row[]; ctx_area_fk100?: string; ctx_area_nk100?: string } | null = null
    try { raw = await response.json() } catch { /* non-JSON */ }
    if (!response.ok || !raw || raw.rt_cd !== '0') throw new KisApiError(raw?.msg_cd ?? '', raw?.msg1 ?? '미체결 주문 조회 실패')
    rows.push(...(raw.output1 ?? raw.output ?? []))
    ctx.fk = raw.ctx_area_fk100 ?? ''
    ctx.nk = raw.ctx_area_nk100 ?? ''
    if (page === 2 || !ctx.fk || !ctx.nk) break
    await sleep(1000)
  }
  return rows.map((row) => {
    const orderId = text(row.odno).trim()
    const orgNo = text(row.ord_gno_brno ?? row.KRX_FWDG_ORD_ORGNO).trim()
    const ordDvsn = text(row.ord_dvsn_cd ?? row.ord_dvsn).trim()
    const orderQty = int(row.ord_qty), filledQty = int(row.tot_ccld_qty)
    return {
      order: {
        orderId, orgNo, cancellable: Boolean(orderId && orgNo && ordDvsn), code: text(row.pdno), name: text(row.prdt_name),
        side: row.sll_buy_dvsn_cd === '02' ? 'buy' as const : 'sell' as const,
        orderQty, filledQty, remainingQty: Math.max(0, orderQty - filledQty),
        price: int(row.ord_unpr), orderedAt: text(row.ord_tmd ?? row.ord_dt),
      },
      ordDvsn,
    }
  })
}

export async function fetchOpenOrders(account: KisAccountClient, productCode: string, sleep?: (ms: number) => Promise<void>): Promise<OpenOrder[]> {
  return (await fetchMetas(account, productCode, sleep)).map(({ order }) => order)
}

export async function findOpenOrder(account: KisAccountClient, productCode: string, orderId: string): Promise<OpenOrderMeta | null> {
  return (await fetchMetas(account, productCode)).find(({ order }) => stripZeros(order.orderId) === stripZeros(orderId)) ?? null
}
