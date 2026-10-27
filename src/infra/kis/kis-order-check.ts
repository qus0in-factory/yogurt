import { BALANCE_PATH, BALANCE_TR_ID, KisApiError, type KisAccountClient } from './kis-stock-balance.ts'
import { KIS_RATE_LIMIT_CODES } from '../../domain/trading/kis-rate-limit.ts'

// 확인 필요: 매수가능조회 경로·TR_ID·응답 필드는 테스트베드에서 확정
export const BUY_CHECK_PATH = '/uapi/domestic-stock/v1/trading/inquire-psbl-order'
export const BUY_CHECK_TR_ID = 'TTTC8908R'
// 확인 필요: 최유리 IOC 구분 코드(후보 15)와 ORD_UNPR 가격 조합은 실계정 문서에서 확정
export const IOC_ORDER_DVSN = '15'
// 확인 필요: 거래소 구분 코드 기본값·필드 위치(query vs body)는 테스트베드에서 확정
export const EXCG_ID_DVSN_CD = 'KRX'
const SELLABLE_QTY_FIELD = 'ord_psbl_qty' // 확인 필요: 잔고조회 output1 필드명은 테스트베드에서 확정
const NRCVB_BUY_QTY_FIELD = 'nrcvb_buy_qty', NRCVB_BUY_AMT_FIELD = 'nrcvb_buy_amt' // 확인 필요: 미수 없는 매수 필드명은 실계정 문서에서 확정

export type OrderFailureCode = 'INSUFFICIENT_BALANCE' | 'EXCEEDS_AVAILABLE' | 'MARKET_CLOSED' | 'RATE_LIMITED' | 'UNKNOWN'

export type CheckStage = 'buyable' | 'sellable'
// 확인 단계와 KIS HTTP 상태를 함께 들고 간다. 값·토큰·계좌번호는 넣지 않는다.
export class CheckStageError extends KisApiError {
  readonly stage: CheckStage
  readonly status: number | null
  constructor(stage: CheckStage, status: number | null, code: string, message: string) {
    super(code, message)
    this.name = 'CheckStageError'
    this.stage = stage
    this.status = status
  }
}

export function mapKisFailure(code: string, message: string): OrderFailureCode {
  if (KIS_RATE_LIMIT_CODES.has(code) || code === 'EGW00123' || /초당|거래건수/.test(message)) return 'RATE_LIMITED'
  if (/잔고|부족/.test(message)) return 'INSUFFICIENT_BALANCE'
  if (/가능수량|초과|한도/.test(message)) return 'EXCEEDS_AVAILABLE'
  if (/장마감|시간|운영|휴장/.test(message)) return 'MARKET_CLOSED'
  return 'UNKNOWN'
}

type RawResponse = { rt_cd?: string; msg_cd?: string; msg1?: string }

const toInt = (value: unknown): number => Math.max(0, Math.floor(Number(value) || 0))

// 계좌번호 체계: 앞 8자리 + 상품 코드 (사용자 지정)
export function splitAccount(accountNumber: string, productCode: string) {
  return { cano: accountNumber.slice(0, 8), prdt: productCode }
}

export async function checkBuyable(
  account: KisAccountClient, productCode: string, stockCode: string, price: number,
): Promise<{ availableQty: number; availableWon: number }> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const response = await account.request(BUY_CHECK_PATH, {
    method: 'GET', trId: BUY_CHECK_TR_ID, priority: 'read',
    query: {
      CANO: cano, ACNT_PRDT_CD: prdt, PDNO: stockCode, EXCG_ID_DVSN_CD,
      ORD_UNPR: String(price), ORD_DVSN: IOC_ORDER_DVSN,
      CMA_EVLU_AMT_ICLD_YN: 'Y', OVRS_ICLD_YN: 'Y',
    },
  })
  const raw = (await response.json()) as RawResponse & { output?: Record<string, unknown> }
  if (raw.rt_cd !== '0') throw new CheckStageError('buyable', response.status, raw.msg_cd ?? '', raw.msg1 ?? '')
  const output = raw.output ?? {}
  const nrcvbQty = output[NRCVB_BUY_QTY_FIELD], nrcvbAmt = output[NRCVB_BUY_AMT_FIELD]
  const availableQty = nrcvbQty === undefined || nrcvbQty === null || nrcvbQty === '' ? toInt(output['ord_psbl_qty']) : toInt(nrcvbQty)
  const availableWon = nrcvbAmt === undefined || nrcvbAmt === null || nrcvbAmt === '' ? toInt(output['ord_psbl_amt']) : toInt(nrcvbAmt)
  console.info(JSON.stringify({ kind: 'buy-cash-diag', nrcvbBuyQty: toInt(output[NRCVB_BUY_QTY_FIELD]), nrcvbBuyAmt: toInt(output[NRCVB_BUY_AMT_FIELD]), ordPsblQty: toInt(output['ord_psbl_qty']), ordPsblAmt: toInt(output['ord_psbl_amt']) }))
  return { availableQty, availableWon }
}

export async function checkSellable(
  account: KisAccountClient, productCode: string, stockCode: string,
): Promise<{ availableQty: number }> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const response = await account.request(BALANCE_PATH, {
    method: 'GET', trId: BALANCE_TR_ID, priority: 'read', query: { CANO: cano, ACNT_PRDT_CD: prdt, EXCG_ID_DVSN_CD },
  })
  const raw = (await response.json()) as RawResponse & { output1?: Array<Record<string, unknown>> }
  if (raw.rt_cd !== '0') throw new CheckStageError('sellable', response.status, raw.msg_cd ?? '', raw.msg1 ?? '')
  const row = (raw.output1 ?? []).find((item) => item['pdno'] === stockCode)
  return { availableQty: toInt(row?.[SELLABLE_QTY_FIELD]) }
}
