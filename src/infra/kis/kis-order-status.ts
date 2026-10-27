import { KisApiError, type KisAccountClient } from './kis-stock-balance.ts'
import { mapKisFailure, splitAccount } from './kis-order-check.ts'
import { NOT_FOUND_FILL, RATE_LIMITED_FILL, type FillNumbers, type FillQuery } from '../../domain/trading/order-fill.ts'

// 확인 필요: 일별 주문체결조회의 경로·TR_ID·파라미터·응답 필드명은 테스트베드에서 확정
export const CCLD_PATH = '/uapi/domestic-stock/v1/trading/inquire-daily-ccld'
export const CCLD_TR_ID = 'TTTC8001R'
const CCLD_FIELDS = { orderNo: 'odno', side: 'sll_buy_dvsn_cd', orderQty: 'ord_qty', filledQty: 'tot_ccld_qty', remainingQty: 'rmn_qty', cancelled: 'cncl_yn' } as const
// 확인 필요: '00'은 전체 조회, INQR_DVSN_1·PDNO·ORD_GNO_BRNO·ODNO는 ''(서버 필터 미사용), EXCG 'ALL'은 확인 필요
const CCLD_PARAMS = { SLL_BUY_DVSN_CD: '00', CCLD_DVSN: '00', INQR_DVSN: '00', INQR_DVSN_3: '00', INQR_DVSN_1: '', PDNO: '', ORD_GNO_BRNO: '', ODNO: '', EXCG_ID_DVSN_CD: 'ALL', CTX_AREA_FK100: '', CTX_AREA_NK100: '' } as const
const ORDER_NO_CANDIDATES = ['odno', 'odno_no', 'ordno', 'orderNo', 'ord_number'] as const
const MAX_CCLD_PAGES = 3
const PAGING_SLEEP_MS = 1000

export type CcldRow = { orderNo: string; code?: string; orderedAt?: string; side: 'buy' | 'sell' | null; orderedQty: number; filledQty: number; remainingQty: number; cancelled: boolean }
type CcldRaw = { rt_cd?: string; msg_cd?: string; msg1?: string; output1?: Array<Record<string, unknown>>; ctx_area_fk100?: string; ctx_area_nk100?: string }

const toInt = (value: unknown) => {
  const parsed = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new KisApiError('', '체결 수량 미확인')
  return parsed
}
// 조회 기간은 KST 당일(시작=종료=오늘)로 고정한다.
const kstDay = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10).replaceAll('-', '')
const stripLeadingZeros = (value: string) => value.replace(/^0+/, '') || '0'

export function findOrderRow(rows: CcldRow[], orderNo: string): CcldRow | null {
  return rows.find((row) => stripLeadingZeros(row.orderNo) === stripLeadingZeros(orderNo)) ?? null
}

const logCcldDiag = (status: number, contentLength: number, raw: CcldRaw | null) => console.info(JSON.stringify({
  kind: 'ccld-diag', status, contentLength, rt_cd: raw?.rt_cd ?? '', msg_cd: raw?.msg_cd ?? '', msg1: raw?.msg1 ?? '', outputKeys: raw ? Object.keys(raw) : [], output1Keys: raw?.output1?.[0] ? Object.keys(raw.output1[0]) : [],
}))

const logNotFound = (rawRows: Array<Record<string, unknown>>) => {
  const keys = rawRows[0] ? Object.keys(rawRows[0]) : []
  console.info(JSON.stringify({ kind: 'ccld-diag', reason: 'order-not-found', rowCount: rawRows.length, firstRowKeys: keys, orderNoKeys: ORDER_NO_CANDIDATES.filter((field) => keys.includes(field)) }))
}

// 안전한 실패: HTTP 오류·빈 본문·비 JSON이어도 KisApiError(체결 조회 실패)로 바꾼다. 날짜 인수는 무시하고 KST 당일 창으로 전체 행을 조회한다.
export async function fetchDailyCcld(account: KisAccountClient, productCode: string, _stockCode: string, _startDate?: string, _endDate?: string, expectedOrderNo?: string,
  sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)), requireComplete = false): Promise<CcldRow[]> {
  const { cano, prdt } = splitAccount(account.accountNumber, productCode)
  const kst = kstDay()
  const rawRows: Array<Record<string, unknown>> = []
  const ctx = { fk: '', nk: '' }
  for (let page = 0; page < MAX_CCLD_PAGES; page++) {
    const response = await account.request(CCLD_PATH, { method: 'GET', trId: CCLD_TR_ID, query: { CANO: cano, ACNT_PRDT_CD: prdt, INQR_STRT_DT: kst, INQR_END_DT: kst, ...CCLD_PARAMS, CTX_AREA_FK100: ctx.fk, CTX_AREA_NK100: ctx.nk } })
    const body = await response.text()
    let raw: CcldRaw | null = null
    if (body) { try { raw = JSON.parse(body) as CcldRaw } catch { /* 비 JSON 본문 */ } }
    if (!response.ok || raw === null || raw.rt_cd !== '0') { logCcldDiag(response.status, body.length, raw); throw new KisApiError(raw?.msg_cd ?? '', raw?.msg1 ?? '체결 조회 실패') }
    if (requireComplete && !Array.isArray(raw.output1)) throw new KisApiError('', '체결 목록 형식 미확인')
    rawRows.push(...(raw.output1 ?? []))
    ctx.fk = raw.ctx_area_fk100 ?? ''; ctx.nk = raw.ctx_area_nk100 ?? ''
    if (requireComplete && page === MAX_CCLD_PAGES - 1 && ctx.fk && ctx.nk) throw new KisApiError('', '체결 목록 조회 범위 초과')
    if (page === MAX_CCLD_PAGES - 1 || !ctx.fk || !ctx.nk) break
    await sleep(PAGING_SLEEP_MS)
  }
  const mapped = rawRows.map((row): CcldRow => ({
    orderNo: String(row[CCLD_FIELDS.orderNo] ?? ''), code: String(row.pdno ?? ''), orderedAt: /^\d{8}$/.test(String(row.ord_dt)) && /^\d{6}$/.test(String(row.ord_tmd)) ? `${String(row.ord_dt).slice(0,4)}-${String(row.ord_dt).slice(4,6)}-${String(row.ord_dt).slice(6,8)}T${String(row.ord_tmd).slice(0,2)}:${String(row.ord_tmd).slice(2,4)}:${String(row.ord_tmd).slice(4,6)}+09:00` : undefined,
    side: row[CCLD_FIELDS.side] === '02' ? 'buy' : row[CCLD_FIELDS.side] === '01' ? 'sell' : null,
    orderedQty: toInt(row[CCLD_FIELDS.orderQty]), filledQty: toInt(row[CCLD_FIELDS.filledQty]),
    remainingQty: toInt(row[CCLD_FIELDS.remainingQty]), cancelled: row[CCLD_FIELDS.cancelled] === 'Y',
  })).filter((row) => row.orderNo !== '')
  if (expectedOrderNo !== undefined && !findOrderRow(mapped, expectedOrderNo)) logNotFound(rawRows)
  return mapped
}

// 단일 주문의 체결 수량 조회. 실패는 null(unknown), 초당 제한 소진은 RATE_LIMITED_FILL(rate_limited), 미발견은 NOT_FOUND_FILL(not_found).
// 재시도·백오프는 공용 KIS 호출 큐(읽기 GET 한정)가 담당한다. 여기서 중복 재시도하지 않는다.
export async function fetchOrderFill(
  account: KisAccountClient, productCode: string, orderNo: string, day: string, sleep?: (ms: number) => Promise<void>,
): Promise<FillQuery | null> {
  try {
    const row = findOrderRow(await fetchDailyCcld(account, productCode, '', day, day, orderNo, sleep), orderNo)
    if (!row) return NOT_FOUND_FILL
    return { orderedQty: row.orderedQty, filledQty: row.filledQty, remainingQty: row.remainingQty, cancelled: row.cancelled } satisfies FillNumbers
  } catch (error) { if (error instanceof KisApiError && mapKisFailure(error.code, error.message) === 'RATE_LIMITED') { console.info(JSON.stringify({ kind: 'ccld-diag', reason: 'rate-limited' })); return RATE_LIMITED_FILL } return null }
}
