import { BALANCE_PATH, BALANCE_TR_ID, KisApiError, type KisAccountClient } from './kis-stock-balance.ts'

// 확인 필요: 매수가능조회 경로·TR_ID·응답 필드는 테스트베드에서 확정
export const BUY_CHECK_PATH = '/uapi/domestic-stock/v1/trading/inquire-psbl-order'
export const BUY_CHECK_TR_ID = 'TTTC8908R'
// 확인 필요: 국내 주식 최유리 IOC 주문 구분 코드(후보 15)는 실계정 문서에서 확정
export const IOC_ORDER_DVSN = '15'
// 확인 필요: 잔고조회 output1의 주문가능수량 필드명은 테스트베드에서 확정
const SELLABLE_QTY_FIELD = 'ord_psbl_qty'

export type OrderFailureCode = 'INSUFFICIENT_BALANCE' | 'EXCEEDS_AVAILABLE' | 'MARKET_CLOSED' | 'UNKNOWN'

export function mapKisFailure(_code: string, message: string): OrderFailureCode {
  if (/잔고|부족/.test(message)) return 'INSUFFICIENT_BALANCE'
  if (/가능수량|초과|한도/.test(message)) return 'EXCEEDS_AVAILABLE'
  if (/장마감|시간|운영|휴장/.test(message)) return 'MARKET_CLOSED'
  return 'UNKNOWN'
}

type RawResponse = { rt_cd?: string; msg_cd?: string; msg1?: string }

function throwOnError(raw: RawResponse): void {
  if (raw.rt_cd !== '0') throw new KisApiError(raw.msg_cd ?? '', raw.msg1 ?? '')
}

const toInt = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

// 계좌번호 체계: 앞 8자리 + 상품 코드 (사용자 지정)
export function splitAccount(accountNumber: string, productCode: string) {
  return { cano: accountNumber.slice(0, 8), prdt: productCode }
}

export async function checkBuyable(
  account: KisAccountClient, productCode: string, stockCode: string, price: number,
): Promise<{ availableQty: number; availableWon: number }> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const response = await account.request(BUY_CHECK_PATH, {
    method: 'GET', trId: BUY_CHECK_TR_ID,
    query: {
      CANO: cano, ACNT_PRDT_CD: prdt, PDNO: stockCode,
      ORD_UNPR: String(price), ORD_DVSN: IOC_ORDER_DVSN,
      CMA_EVLU_AMT_ICLD_YN: 'Y', OVRS_ICLD_YN: 'Y',
    },
  })
  const raw = (await response.json()) as RawResponse & { output?: Record<string, unknown> }
  throwOnError(raw)
  const output = raw.output ?? {}
  return { availableQty: toInt(output['ord_psbl_qty']), availableWon: toInt(output['ord_psbl_amt']) }
}

export async function checkSellable(
  account: KisAccountClient, productCode: string, stockCode: string,
): Promise<{ availableQty: number }> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const response = await account.request(BALANCE_PATH, {
    method: 'GET', trId: BALANCE_TR_ID, query: { CANO: cano, ACNT_PRDT_CD: prdt },
  })
  const raw = (await response.json()) as RawResponse & { output1?: Array<Record<string, unknown>> }
  throwOnError(raw)
  const row = (raw.output1 ?? []).find((item) => item['pdno'] === stockCode)
  return { availableQty: toInt(row?.[SELLABLE_QTY_FIELD]) }
}
