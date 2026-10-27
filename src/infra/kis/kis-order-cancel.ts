import { type KisAccountClient } from './kis-stock-balance.ts'
import { splitAccount } from './kis-order-check.ts'

export const CANCEL_ORDER_PATH = '/uapi/domestic-stock/v1/trading/order-rvsecncl'
export const CANCEL_ORDER_TR_ID = 'TTTC0803U'

export type CancelOpenOrderResult =
  | { ok: true; cancelOrderId: string }
  | { ok: false; code: string; message: string }

type CancelInput = { orderId: string; orgNo: string; ordDvsn: string }

export async function cancelOpenOrder(
  account: KisAccountClient, productCode: string, input: CancelInput,
): Promise<CancelOpenOrderResult> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const body = {
    CANO: cano, ACNT_PRDT_CD: prdt,
    KRX_FWDG_ORD_ORGNO: input.orgNo, ORGN_ODNO: input.orderId, ORD_DVSN: input.ordDvsn,
    RVSE_CNCL_DVSN_CD: '02', ORD_QTY: '0', ORD_UNPR: '0', QTY_ALL_ORD_YN: 'Y',
  }
  const hash = await account.hashkey?.(body)
  const response = await account.request(CANCEL_ORDER_PATH, {
    method: 'POST', trId: CANCEL_ORDER_TR_ID, priority: 'order', body,
    headers: hash ? { hashkey: hash } : {}, retry: false,
  })
  let raw: { rt_cd?: string; msg_cd?: string; msg1?: string; output?: Record<string, unknown> } | null = null
  try { raw = await response.json() } catch { /* non-JSON */ }
  if (!response.ok || !raw || raw.rt_cd !== '0') {
    return { ok: false, code: raw?.msg_cd ?? '', message: raw?.msg1 ?? '' }
  }
  const cancelOrderId = raw.output?.ODNO ?? raw.output?.odno
  if (typeof cancelOrderId !== 'string' || !cancelOrderId) {
    return { ok: false, code: 'CANCEL_ORDER_ID_MISSING', message: '취소 주문번호를 확인할 수 없습니다' }
  }
  return { ok: true, cancelOrderId }
}
