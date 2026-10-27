import { KisApiError, type KisAccountClient } from './kis-stock-balance.ts'
import { splitAccount } from './kis-order-check.ts'

// 확인 필요: 국내 주식 호가 경로·TR_ID·최우선 호가 필드명은 테스트베드에서 확정
export const ASK_PATH = '/uapi/domestic-stock/v1/quotations/inquire-asking-price'
export const ASK_TR_ID = 'FHKST01010200'
// 확인 필요: output1의 최우선 매도호가·매수호가 필드명은 테스트베드에서 확정
export const ASK1_FIELD = 'askp1'
export const BID1_FIELD = 'bidp1'

export type BestQuotes = { ask1: number; bid1: number }

const toPrice = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

// 매수 예상가 = 최우선 매도호가(ask1), 매도 예상가 = 최우선 매수호가(bid1).
// 호가가 없거나 0 이하면 가격 없음(null)으로 처리해 주문을 막는다.
export function expectedPrice(side: 'buy' | 'sell', quotes: BestQuotes): number | null {
  const price = side === 'buy' ? quotes.ask1 : quotes.bid1
  return price > 0 ? price : null
}

export async function fetchBestQuotes(
  account: KisAccountClient, productCode: string, stockCode: string,
): Promise<BestQuotes> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const response = await account.request(ASK_PATH, {
    method: 'GET', trId: ASK_TR_ID,
    query: { CANO: cano, ACNT_PRDT_CD: prdt, PDNO: stockCode },
  })
  const raw = (await response.json()) as { rt_cd?: string; msg_cd?: string; msg1?: string; output1?: Record<string, unknown> }
  if (raw.rt_cd !== '0') throw new KisApiError(raw.msg_cd ?? '', raw.msg1 ?? '')
  const output = raw.output1 ?? {}
  return { ask1: toPrice(output[ASK1_FIELD]), bid1: toPrice(output[BID1_FIELD]) }
}
