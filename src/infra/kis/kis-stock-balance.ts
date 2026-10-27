import { parseStockBalance } from '../../domain/kis/stock-balance.ts'
import type { KisQueuePriority } from './kis-request-queue.ts'

export type KisAccountClient = {
  accountNumber: string
  request: (path: string, options: { method: string; trId: string; query?: Record<string, string>; body?: unknown; headers?: Record<string, string>; retry?: boolean; priority?: KisQueuePriority }) => Promise<Response>
  hashkey?: (body: unknown) => Promise<string>
}

export class KisApiError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'KisApiError'
    this.code = code
  }
}

export const BALANCE_PATH = '/uapi/domestic-stock/v1/trading/inquire-balance'
export const BALANCE_TR_ID = 'TTTC8434R'
const PATH = BALANCE_PATH
const TR_ID = BALANCE_TR_ID
const PAGE_QUERY = {
  AFHR_FLPR_YN: 'N', OFL_YN: '', INQR_DVSN: '02', UNPR_DVSN: '01',
  FUND_STTL_ICLD_YN: 'N', FNCG_AMT_AUTO_RDPT_YN: 'N', PRCS_DVSN: '00',
  CTX_AREA_FK100: '', CTX_AREA_NK100: '',
} as const

type RawResponse = { rt_cd?: string; msg_cd?: string; msg1?: string }

export async function fetchStockBalance(account: KisAccountClient, productCode: string) {
  const response = await account.request(PATH, {
    method: 'GET', trId: TR_ID,
    query: { CANO: account.accountNumber, ACNT_PRDT_CD: productCode, ...PAGE_QUERY },
  })
  const raw = (await response.json()) as RawResponse & { output1?: unknown; output2?: unknown }
  if (raw.rt_cd !== '0') throw new KisApiError(raw.msg_cd ?? '', raw.msg1 ?? '')
  const first = Array.isArray(raw.output1) ? raw.output1[0] : undefined
  console.info(JSON.stringify({ kind: 'balance-diag', hasOrdPsblQty: typeof first === 'object' && first !== null && 'ord_psbl_qty' in first }))
  return parseStockBalance(raw)
}
