import { KisApiError, type KisAccountClient } from './kis-stock-balance.ts'

// 확인 필요: 국내 주식 호가 경로·TR_ID는 테스트베드에서 확정.
// 실계좌 스모크에서 계좌 파라미터(CANO·ACNT_PRDT_CD·PDNO) 형식이 빈 응답의 원인으로 추정되어
// 현재가 조회(inquire-price)와 같은 시세 형식(FID_COND_MRKT_DIV_CODE·FID_INPUT_ISCD)으로 보낸다.
export const ASK_PATH = '/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn'
export const ASK_TR_ID = 'FHKST01010200'
// 확인 필요: EXCG_ID_DVSN_CD 필요 여부는 테스트베드에서 확정. 현재가 조회 형식과 같게 기본은 넣지 않는다.
// 확인 필요: output1의 최우선 매도호가·매수호가 필드명은 테스트베드에서 확정
export const ASK1_FIELD = 'askp1'
export const BID1_FIELD = 'bidp1'

export type BestQuotes = { ask1: number; bid1: number }

type QuoteRaw = { rt_cd?: string; msg_cd?: string; msg1?: string; output1?: Record<string, unknown> }

const QUOTE_FAIL_MESSAGE = '호가 조회 실패'

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

// 진단 로그는 상태와 형태만 남긴다. 값·토큰·계좌번호는 들어가지 않는다.
function logQuoteDiag(status: number, contentLength: number, raw: QuoteRaw | null): void {
  console.info(JSON.stringify({
    kind: 'quote-diag', status, contentLength,
    rt_cd: raw?.rt_cd ?? '', msg_cd: raw?.msg_cd ?? '', msg1: raw?.msg1 ?? '',
    outputKeys: raw?.output1 && typeof raw.output1 === 'object' ? Object.keys(raw.output1) : [],
  }))
}

// 안전한 실패: HTTP 오류·빈 본문·비 JSON이어도 json() 파싱 예외로 죽지 않고 KisApiError로 바꾼다.
export async function fetchBestQuotes(
  account: KisAccountClient, productCode: string, stockCode: string,
): Promise<BestQuotes> {
  const response = await account.request(ASK_PATH, {
    method: 'GET', trId: ASK_TR_ID, priority: 'read',
    query: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: stockCode },
  })
  const body = await response.text()
  let raw: QuoteRaw | null = null
  if (body) {
    try { raw = JSON.parse(body) as QuoteRaw } catch { /* 비 JSON 본문 */ }
  }
  if (!response.ok || raw === null || raw.rt_cd !== '0') {
    logQuoteDiag(response.status, body.length, raw)
    throw new KisApiError(raw?.msg_cd ?? '', QUOTE_FAIL_MESSAGE)
  }
  const output = raw.output1 ?? {}
  if (!(ASK1_FIELD in output) || !(BID1_FIELD in output)) logQuoteDiag(response.status, body.length, raw)
  return { ask1: toPrice(output[ASK1_FIELD]), bid1: toPrice(output[BID1_FIELD]) }
}
